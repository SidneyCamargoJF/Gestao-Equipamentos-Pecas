// =====================================================
// BACKEND (Apps Script) - CADASTRO DE CHAMADO
// Chamado pelo cliente (CadastroChamadoFormJS) via google.script.run
// =====================================================

/**
 * Salva um chamado em tbl_chamados -- cria um novo (dados.id vazio) ou
 * atualiza um existente (dados.id preenchido, modo edição), e registra a
 * ação em tbl_chamado_historico. Exige Patrimônio e/ou Localização
 * Equipamento é guardado só por ID (nunca duplica dado de
 * tbl_equipamentos):
 * - Equipamento: localizado em tbl_equipamentos pelo Patrimônio digitado;
 *   se não achar por Patrimônio, tenta pela Localização.
 *   
 * - No modo edição, campos que não fazem parte do formulário (ID_PECA,
 *   DATA_ABERTURA, DATA_INICIO_ANDAMENTO, DATA_FINALIZACAO, STATUS) são
 *   preservados como estavam
 */
function salvarChamadoBackend(dados) {
  try {
    if (!dados || !String(dados.motivo || '').trim()) {
      return { sucesso: false, mensagem: 'Preencha o motivo do chamado.' };
    }

    const patrimonioDigitado = String(dados.patrimonio || '').trim();
    const localizacaoDigitada = String(dados.localizacao || '').trim();

    if (!patrimonioDigitado && !localizacaoDigitada) {
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
    if (!equipamentoId && localizacaoDigitada) {
      equipamentoId = buscarEquipamentoIdPorLocalizacao(localizacaoDigitada);
    }
    const equipamentoEncontrado = !!equipamentoId;

    const dataAtual = Utilities.formatDate(new Date(), 'GMT-3', 'dd/MM/yyyy');
    const idEdicao = dados.id ? Number(dados.id) : null;

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

      const linhaAtualizada = [
        idEdicao,
        equipamentoId,
        dados.motivo,
        dados.tipo || '',
        dados.classificacao || '',
        linhaAtual[5],
        dados.abertoPor || '',
        dados.atribuidoA || '',
        linhaAtual[8],
        linhaAtual[9],
        dados.descricao || '',
        linhaAtual[11],
        dataAtual
      ];

      abaChamados.getRange(linhaReal, 1, 1, numColumnsTickets).setValues([linhaAtualizada]);
      adicionarHistoricoSistema(idEdicao, 'Chamado editado');

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
        mensagem: 'Chamado atualizado com sucesso!',
        id: idEdicao,
        equipamentoEncontrado: equipamentoEncontrado,
        duplicado: existeAnexoDuplicado
      };
    }

    // ===== MODO CRIAÇÃO =====
    const ultimaLinhaPlanilha = abaChamados.getLastRow();
    const ultimaLinha = Math.max(ultimaLinhaPlanilha, firstLineTickets - 1);

    let novoId;
    if (ultimaLinha < firstLineTickets) {
      novoId = 1;
    } else {
      let idAtual = abaChamados.getRange(ultimaLinha, 1).getValue();
      if (idAtual === '' || isNaN(Number(idAtual))) idAtual = 0;
      novoId = Number(idAtual) + 1;
    }

    // Ordem: ID, ID_EQUIPAMENTO, DEFEITO, TIPO, PRIORIDADE, DATA_ABERTURA,
    // ABERTO_POR, ATRIBUIDO_A, DATA_INICIO_ANDAMENTO, DATA_FINALIZACAO,
    // OBSERVACAO, STATUS, DATA_ALTERACAO (13 colunas -- RELATORIO/NOTA_FISCAL
    const novaLinha = [
      novoId,
      equipamentoId,
      dados.motivo,
      dados.tipo || '',
      dados.classificacao || '',
      dataAtual,
      dados.abertoPor || '',
      dados.atribuidoA || '',
      '',
      '',
      dados.descricao || '',
      'Aberto',
      ''
    ];

    abaChamados.getRange(ultimaLinha + 1, 1, 1, numColumnsTickets).setValues([novaLinha]);

    adicionarHistoricoSistema(novoId, 'Chamado aberto');

    //map guarda o retorno de cada chamada numa lista nova
    const respostasRelatorios = (dados.relatorios || []).map(arquivo => adicionarAnexoChamado(novoId, 'Relatório', arquivo));
    const respostasNotasFiscais = (dados.notasFiscais || []).map(arquivo => adicionarAnexoChamado(novoId, 'Nota Fiscal', arquivo));
    const existeAnexoDuplicado = respostasRelatorios.concat(respostasNotasFiscais).some(r => r && r.duplicado);


    return {
      sucesso: true,
      mensagem: equipamentoEncontrado
        ? 'Chamado aberto com sucesso!'
        : 'Chamado aberto com sucesso! (Não foi possível vincular a um equipamento. Confira o Patrimônio/Localização e edite o chamado posteriormente.)',
      id: novoId,
      equipamentoEncontrado: equipamentoEncontrado,
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

    return {
      id: linha[0],
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


