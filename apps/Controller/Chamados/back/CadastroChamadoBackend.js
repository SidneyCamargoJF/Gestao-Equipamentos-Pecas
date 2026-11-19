// =====================================================
// BACKEND (Apps Script) - CADASTRO DE CHAMADO
// Chamado pelo cliente (CadastroChamadoFormJS) via google.script.run
// =====================================================

/**
 * Salva um chamado em tbl_chamados -- cria um novo (dados.id vazio) ou
 * atualiza um existente (dados.id preenchido, modo edição), e registra a
 * ação em tbl_chamado_historico. Exige Patrimônio e/ou Localização.
 * Equipamento é guardado só por ID (nunca duplica dado de tbl_equipamentos):
 * - procurado pelo Patrimônio; se não achar, pela Localização -- mas só se
 *   a localização tiver UM equipamento. Com mais de um, devolve
 *   { escolherEquipamento: true, opcoes } pra tela pedir que a pessoa
 *   escolha (e reenviar com dados.equipamentoId).
 * - Achando o equipamento, procura o contrato vigente que o cobre e
 *   preenche CONTRATO_ID, FORNECEDOR_ID, ATRIBUÍDO A (se vazio) e os
 *   prazos de SLA da prioridade.
 * "Aberto por" é sempre o usuário logado (na edição fica o original).
 * No modo edição, campos que não fazem parte do formulário (DATA_ABERTURA,
 * DATA_INICIO_ANDAMENTO, DATA_FINALIZACAO, STATUS e as colunas de
 * contrato/prazos já preenchidas) são preservados.
 */
function salvarChamadoBackend(dados) {
  try {
    return executarComLock(function () { return salvarChamadoBackend_(dados); });
  } catch (e) {
    return { sucesso: false, mensagem: 'Erro no servidor: ' + e.message };
  }
}

// opcoes (uso interno, não vem da tela): { contratoId } força o contrato
// em vez de procurar o vigente -- usado pela corretiva aberta a partir de
// um item não conforme, que herda o contrato da OS de origem.
function salvarChamadoBackend_(dados, opcoes) {
  try {
    if (!dados || !String(dados.motivo || '').trim()) {
      return { sucesso: false, mensagem: 'Preencha o motivo do chamado.' };
    }

    const patrimonioDigitado = String(dados.patrimonio || '').trim();
    const localizacaoDigitada = String(dados.localizacao || '').trim();

    if (!patrimonioDigitado && !localizacaoDigitada && !dados.equipamentoId) {
      return { sucesso: false, mensagem: 'Informe pelo menos o Patrimônio ou a Localização do equipamento.' };
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const abaChamados = ss.getSheetByName(ticketsTableName);
    if (!abaChamados) {
      return { sucesso: false, mensagem: "Aba 'tbl_chamados' não foi encontrada na planilha." };
    }

    let equipamentoId = '';
    if (patrimonioDigitado) {
      equipamentoId = buscarEquipamentoIdPorPatrimonio(patrimonioDigitado);
    }
    if (!equipamentoId && dados.equipamentoId) {
      // escolhido pela pessoa na lista de equipamentos da localização
      const escolhido = ReadEquipments().find(e => Number(e[0]) === Number(dados.equipamentoId));
      if (escolhido) equipamentoId = escolhido[0];
    }
    if (!equipamentoId && localizacaoDigitada) {
      const naLocalizacao = listarEquipamentosPorLocalizacao(localizacaoDigitada);
      if (naLocalizacao.length === 1) {
        equipamentoId = naLocalizacao[0].id;
      } else if (naLocalizacao.length > 1) {
        return {
          sucesso: false,
          escolherEquipamento: true,
          opcoes: naLocalizacao,
          mensagem: 'Há ' + naLocalizacao.length + ' equipamentos em "' + localizacaoDigitada + '". Escolha qual é o do chamado.'
        };
      }
    }
    const equipamentoEncontrado = !!equipamentoId;

    const agora = new Date();
    const dataAtual = Utilities.formatDate(agora, 'GMT-3', 'dd/MM/yyyy');
    const idEdicao = dados.id ? Number(dados.id) : null;

    const contratoForcado = opcoes && opcoes.contratoId ? Number(opcoes.contratoId) : 0;
    const cacheContratos = (equipamentoId || contratoForcado) ? carregarCacheContratos_() : null;
    let vigente = null;
    if (contratoForcado) {
      const linhaContrato = cacheContratos.contratos.find(l => Number(l[contractIdCol]) === contratoForcado);
      if (linhaContrato) vigente = { contrato: montarContratoResumo_(linhaContrato, cacheContratos), aviso: '' };
    } else if (equipamentoId) {
      vigente = buscarContratoVigentePorEquipamento(equipamentoId, agora, cacheContratos);
    }
    const contrato = vigente ? vigente.contrato : null;
    const atribuidoA = String(dados.atribuidoA || '').trim() || (contrato ? contrato.empresa : '');

    // ===== MODO EDIÇÃO =====
    if (idEdicao) {
      const todasLinhas = ReadTickets();
      const idx = todasLinhas.findIndex(l => Number(l[0]) === idEdicao);
      if (idx === -1) {
        return { sucesso: false, mensagem: 'Chamado não encontrado para edição (ID ' + idEdicao + ').' };
      }

      const linhaReal = idx + firstLineTickets;
      // cópia do conteúdo da linha atual
      const linhaAtual = todasLinhas[idx];
      const col = c => linhaAtual[c - 1];

      // Contrato/prazos já gravados ficam; só preenche se ainda não tinha.
      let contratoId = col(ticketsContratoIdCol);
      let fornecedorId = col(ticketsFornecedorIdCol);
      let prazoAtendimento = col(ticketsPrazoAtendimentoCol);
      let prazoSolucao = col(ticketsPrazoSolucaoCol);
      let vinculouAgora = false;
      if (!contratoId && contrato) {
        contratoId = contrato.id;
        fornecedorId = contrato.fornecedorId;
        vinculouAgora = true;
        if (!prazoAtendimento && !prazoSolucao) {
          const prazos = calcularPrazosChamado(contrato.id, dados.classificacao, agora, cacheContratos.sla);
          prazoAtendimento = prazos.prazoAtendimento;
          prazoSolucao = prazos.prazoSolucao;
        }
      }

      const linhaAtualizada = [
        idEdicao,
        equipamentoId,
        dados.motivo,
        dados.tipo || '',
        dados.classificacao || '',
        col(6),
        col(7),             // Aberto por: mantém quem abriu
        atribuidoA,
        col(9),
        col(10),
        dados.descricao || '',
        col(12),
        dataAtual,
        contratoId || '',
        col(ticketsOrigemCol) || 'manual',
        textoLiteralPlanilha(col(ticketsCompetenciaCol)),
        col(ticketsDataPrevistaCol),
        prazoAtendimento || '',
        prazoSolucao || '',
        fornecedorId || '',
        col(ticketsDtExclusaoCol)
      ];

      abaChamados.getRange(linhaReal, 1, 1, numColumnsTickets).setValues([linhaAtualizada]);
      adicionarHistoricoSistema(idEdicao, 'Chamado editado');
      if (vinculouAgora) {
        adicionarHistoricoSistema(idEdicao, 'Vinculado ao contrato ' + contrato.numero + ' (' + contrato.empresa + ')');
      }

      //dados.relatorios é uma lista dos arquivos que vieram do front em forma de objeto {nome, tipo, base64
      // o || [] se estiver vazio troca para um alista vazia para nao quebrar o map
      //.map passa por cada item dessa lista, e a cada volta o item fica guardado no 'arquivo', map constrói uma lista nova
      //chama a função de salvar anexo, passando o id, o texto do tipo e o arquivo
      // e a variavel do começo guarda a lista nova com o resultado do upload específico
      const respostasRelatorios = (dados.relatorios || []).map(arquivo => adicionarAnexoChamado(idEdicao, 'Relatório', arquivo));
      const respostasNotasFiscais = (dados.notasFiscais || []).map(arquivo => adicionarAnexoChamado(idEdicao, 'Nota Fiscal', arquivo));
      const existeAnexoDuplicado = respostasRelatorios.concat(respostasNotasFiscais).some(r => r && r.duplicado);

      return {
        sucesso: true,
        mensagem: 'Chamado atualizado com sucesso!' + (vigente && vigente.aviso ? '\n' + vigente.aviso : ''),
        id: idEdicao,
        equipamentoEncontrado: equipamentoEncontrado,
        duplicado: existeAnexoDuplicado
      };
    }

    // ===== MODO CRIAÇÃO =====
    const pos = proximoIdTabela(abaChamados, firstLineTickets);
    const novoId = pos.novoId;
    const prazos = contrato
      ? calcularPrazosChamado(contrato.id, dados.classificacao, agora, cacheContratos.sla)
      : { prazoAtendimento: '', prazoSolucao: '' };

    // Ordem: ID, ID_EQUIPAMENTO, DEFEITO, TIPO, PRIORIDADE, DATA_ABERTURA,
    // ABERTO_POR, ATRIBUIDO_A, DATA_INICIO_ANDAMENTO, DATA_FINALIZACAO,
    // OBSERVACAO, STATUS, DATA_ALTERACAO, CONTRATO_ID, ORIGEM, COMPETENCIA,
    // DATA_PREVISTA, PRAZO_ATENDIMENTO, PRAZO_SOLUCAO, FORNECEDOR_ID, DATA_EXCLUSAO
    const novaLinha = [
      novoId,
      equipamentoId,
      dados.motivo,
      dados.tipo || '',
      dados.classificacao || '',
      dataAtual,
      nomeUsuarioLogado(),
      atribuidoA,
      '',
      '',
      dados.descricao || '',
      'Aberto',
      '',
      contrato ? contrato.id : '',
      'manual',
      '',
      '',
      prazos.prazoAtendimento,
      prazos.prazoSolucao,
      contrato ? contrato.fornecedorId : '',
      ''
    ];

    abaChamados.getRange(pos.proximaLinha, 1, 1, numColumnsTickets).setValues([novaLinha]);

    adicionarHistoricoSistema(novoId, 'Chamado aberto');
    if (contrato) {
      adicionarHistoricoSistema(novoId, 'Vinculado ao contrato ' + contrato.numero + ' (' + contrato.empresa + ')' +
        (vigente.aviso ? '. ' + vigente.aviso : ''));
    }

    //map guarda o retorno de cada chamada numa lista nova
    const respostasRelatorios = (dados.relatorios || []).map(arquivo => adicionarAnexoChamado(novoId, 'Relatório', arquivo));
    const respostasNotasFiscais = (dados.notasFiscais || []).map(arquivo => adicionarAnexoChamado(novoId, 'Nota Fiscal', arquivo));
    const existeAnexoDuplicado = respostasRelatorios.concat(respostasNotasFiscais).some(r => r && r.duplicado);

    let mensagem = equipamentoEncontrado
      ? 'Chamado aberto com sucesso!'
      : 'Chamado aberto com sucesso! (Não foi possível vincular a um equipamento. Confira o Patrimônio/Localização e edite o chamado posteriormente.)';
    if (contrato) mensagem += '\nContrato ' + contrato.numero + ' — ' + contrato.empresa + '.';
    if (vigente && vigente.aviso) mensagem += '\n' + vigente.aviso;

    return {
      sucesso: true,
      mensagem: mensagem,
      id: novoId,
      equipamentoEncontrado: equipamentoEncontrado,
      contrato: contrato,
      duplicado: existeAnexoDuplicado
    };
  } catch (e) {
    return { sucesso: false, mensagem: 'Erro no servidor: ' + e.message };
  }
}

/**
 * Busca um chamado pelo ID pra pré-preencher o formulário de Cadastro no
 * modo edição. 
 * Retorna null se não encontrar.
 */
function buscarChamadoParaEdicao(idInput) {
  try {
    const idBuscado = Number(idInput);
    const dados = ReadTickets();
    const linha = dados.find(l => Number(l[0]) === idBuscado);
    if (!linha) return null;

    let patrimonio = '', localizacao = '', marca = '', modelo = '', capacidade = '';
    if (linha[1]) {
      const equipamentos = ReadEquipments();
      const equip = equipamentos.find(e => Number(e[0]) === Number(linha[1]));
      if (equip) {
        patrimonio = equip[5] || '';
        localizacao = equip[7] || '';
        marca = equip[2] || '';
        modelo = equip[4] || '';
        capacidade = equip[3] || '';
      }
    }

    let contrato = null;
    if (linha[ticketsContratoIdCol - 1]) {
      const c = ReadContracts().find(l => Number(l[contractIdCol]) === Number(linha[ticketsContratoIdCol - 1]));
      if (c) contrato = { id: c[contractIdCol], numero: String(c[contractNumberCol] || ''), empresa: String(c[contractEmpresaCol] || '') };
    }

    return {
      id: linha[0],
      equipamentoId: linha[1] || '',
      contrato: contrato,
      origem: linha[ticketsOrigemCol - 1] || '',
      prazoAtendimento: linha[ticketsPrazoAtendimentoCol - 1] || '',
      prazoSolucao: linha[ticketsPrazoSolucaoCol - 1] || '',
      motivo: linha[2],
      tipo: linha[3],
      classificacao: linha[4],
      abertoPor: linha[6],
      atribuidoA: linha[7],
      descricao: linha[10],
      patrimonio: patrimonio,
      localizacao: localizacao,
      marca: marca,
      modelo: modelo,
      capacidade: capacidade
    };
  } catch (e) {
    return null;
  }
}

function filtrarFuncionarios() {
  const dados = ReadEmployees();
  return dados.map(linha => ({ id: linha[0], nome: linha[1] }));
}

/**
 * Adiciona uma entrada em tbl_chamado_anexos para um anexo.
 */
function adicionarAnexoChamado(chamadoId, tipo, arquivo) {
  const resultado = adicionarAnexoGenerico({
    tabelaAnexos: ticketAnexosTableName,
    idRegistro: chamadoId,
    tipo: tipo,
    arquivo: arquivo,
    firstLine: firstLineTicketAnexos,
    numColumns: numColumnsTicketAnexos
  });

  if (resultado.sucesso) {
    adicionarHistoricoSistema(chamadoId, 'Anexo adicionado: "' + resultado.nomeArquivo + '" (' + tipo + ')');
  }

  return resultado;
}

/**
 * Adiciona uma entrada em tbl_chamado_historico pra um chamado.
 */
function adicionarHistoricoChamado(chamadoId, texto) {
  executarComLock(function () { adicionarHistoricoChamado_(chamadoId, texto); });
}

function adicionarHistoricoChamado_(chamadoId, texto) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const abaHistorico = ss.getSheetByName(ticketHistoricoTableName);
  if (!abaHistorico) return;

  const ultimaLinhaPlanilha = abaHistorico.getLastRow();
  const ultimaLinha = Math.max(ultimaLinhaPlanilha, firstLineTicketHistorico - 1);

  let idAtual = (ultimaLinha >= firstLineTicketHistorico) ? abaHistorico.getRange(ultimaLinha, 1).getValue() : 0;
  if (idAtual === '' || isNaN(Number(idAtual))) idAtual = 0;
  const novoId = Number(idAtual) + 1;

  const dataAtual = Utilities.formatDate(new Date(), 'GMT-3', 'dd/MM/yyyy HH:mm');
  const novaLinha = [novoId, chamadoId, texto, dataAtual, ''];
  abaHistorico.getRange(ultimaLinha + 1, 1, 1, numColumnsTicketHistorico).setValues([novaLinha]);
}

// Prefixo usado pra marcar entradas de histórico geradas automaticamente
// pelo sistema (abertura, troca de status, desativação...), pra diferenciar
// de anotações manuais -- sem precisar de coluna nova na planilha. O
// prefixo nunca aparece pro usuário (buscarHistoricoChamado remove antes
// de devolver pro cliente).
const HISTORICO_CHAMADO_PREFIXO_SISTEMA = '[SISTEMA] ';
const HISTORICO_CHAMADO_PREFIXO_EXCLUIDA = '[EXCLUIDA] ';

function adicionarHistoricoSistema(chamadoId, texto) {
  adicionarHistoricoChamado(chamadoId, HISTORICO_CHAMADO_PREFIXO_SISTEMA + texto);
}



/**
 * Várias entradas de sistema no histórico de uma vez (um setValues só) --
 * usado pela geração automática de preventivas. itens: [{ chamadoId, texto }]
 */
function adicionarHistoricoSistemaLote(itens) {
  if (!itens || !itens.length) return;
  executarComLock(function () {
    const abaHistorico = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ticketHistoricoTableName);
    if (!abaHistorico) return;
    const pos = proximoIdTabela(abaHistorico, firstLineTicketHistorico);
    const dataAtual = Utilities.formatDate(new Date(), 'GMT-3', 'dd/MM/yyyy HH:mm');
    const linhas = itens.map(function (item, i) {
      return [pos.novoId + i, item.chamadoId, HISTORICO_CHAMADO_PREFIXO_SISTEMA + item.texto, dataAtual, ''];
    });
    abaHistorico.getRange(pos.proximaLinha, 1, linhas.length, numColumnsTicketHistorico).setValues(linhas);
  });
}
