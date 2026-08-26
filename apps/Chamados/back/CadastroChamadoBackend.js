// =====================================================
// BACKEND (Apps Script) - CADASTRO DE CHAMADO
// Chamado pelo cliente (CadastroChamadoFormJS) via google.script.run
// =====================================================

/**
 * Salva um novo chamado em tbl_chamados e registra a abertura em
 * tbl_chamado_historico. Exige Patrimônio e/ou Localização (validado aqui
 * de novo, por segurança, mesmo já validado no cliente). Equipamento e
 * peças são guardados só por ID (nunca duplica dado de
 * tbl_equipamentos/tbl_pecas):
 * - Equipamento: localizado em tbl_equipamentos pelo Patrimônio digitado;
 *   se não achar por Patrimônio, tenta pela Localização (só resolve se
 *   bater com exatamente 1 equipamento). Se não resolver nenhum dos dois,
 *   o chamado é salvo mesmo assim, sem vínculo (e o cliente é avisado).
 * - Peças: várias, vêm prontas do cliente (array de IDs); gravadas na
 *   mesma célula separadas por "-" (ex: "1-3-5").
 *
 * Retorna { sucesso: boolean, mensagem: string, id?: number, equipamentoEncontrado?: boolean }
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

    const dataAtual = Utilities.formatDate(new Date(), 'GMT-3', 'dd/MM/yyyy');

    let equipamentoId = '';
    if (patrimonioDigitado) {
      equipamentoId = buscarEquipamentoIdPorPatrimonio(patrimonioDigitado);
    }
    if (!equipamentoId && localizacaoDigitada) {
      equipamentoId = buscarEquipamentoIdPorLocalizacao(localizacaoDigitada);
    }
    const equipamentoEncontrado = !!equipamentoId;

    const pecaIdsTexto = (Array.isArray(dados.pecaIds) && dados.pecaIds.length > 0)
      ? dados.pecaIds.join('-')
      : '';

    // Ordem: ID, ID_EQUIPAMENTO, ID_PECA, DEFEITO, TIPO, PRIORIDADE,
    // DATA_ABERTURA, ATRIBUIDO_A, DATA_INICIO_ANDAMENTO, DATA_FINALIZACAO,
    // OBSERVACAO, RELATORIO, NOTA_FISCAL, STATUS, DATA_ALTERACAO
    const novaLinha = [
      novoId,
      equipamentoId,
      pecaIdsTexto,
      dados.motivo,
      dados.tipo || '',
      dados.classificacao || '',
      dataAtual,
      dados.atribuidoA || '',
      '',
      '',
      dados.descricao || '',
      '',
      '',
      'Aberto',
      ''
    ];

    abaChamados.getRange(ultimaLinha + 1, 1, 1, numColumnsTickets).setValues([novaLinha]);

    adicionarHistoricoChamado(novoId, 'Chamado aberto');

    return {
      sucesso: true,
      mensagem: equipamentoEncontrado
        ? 'Chamado aberto com sucesso!'
        : 'Chamado aberto com sucesso! (Não foi possível vincular a um equipamento cadastrado -- confira o Patrimônio/Localização quando o cadastro de Equipamentos estiver mais completo.)',
      id: novoId,
      equipamentoEncontrado: equipamentoEncontrado
    };
  } catch (e) {
    return { sucesso: false, mensagem: 'Erro no servidor: ' + e.message };
  }
}

/**
 * Verifica se existe um equipamento com esse Patrimônio em tbl_equipamentos.
 * Chamado ao sair do campo Patrimônio (evento blur), igual
 * verificarCnpjAoSair() do Cadastro de Fornecedor. Nunca bloqueia o
 * cadastro -- só informa.
 * Retorna { existe: boolean, marca?: string, modelo?: string }
 */
function verificarPatrimonioChamado(patrimonio) {
  const patrimonioBuscado = String(patrimonio || '').trim().toLowerCase();
  if (!patrimonioBuscado) return { existe: false };

  const dados = ReadEquipments();
  for (let i = 0; i < dados.length; i++) {
    const patrimonioLinha = String(dados[i][5] || '').trim().toLowerCase();
    if (patrimonioLinha === patrimonioBuscado) {
      return { existe: true, marca: dados[i][3] || '', modelo: dados[i][4] || '' };
    }
  }
  return { existe: false };
}

/**
 * Busca o ID de um equipamento em tbl_equipamentos pelo Patrimônio.
 * Retorna o ID ou '' se não encontrar.
 */
function buscarEquipamentoIdPorPatrimonio(patrimonio) {
  const patrimonioBuscado = String(patrimonio || '').trim().toLowerCase();
  if (!patrimonioBuscado) return '';

  const dados = ReadEquipments();
  for (let i = 0; i < dados.length; i++) {
    const patrimonioLinha = String(dados[i][5] || '').trim().toLowerCase();
    if (patrimonioLinha === patrimonioBuscado) {
      return dados[i][0];
    }
  }
  return '';
}

/**
 * Busca o ID de um equipamento em tbl_equipamentos pela Localização --
 * só resolve se bater com exatamente 1 equipamento (Localização sozinha
 * não é uma chave única, então em caso de ambiguidade não arrisca).
 * Retorna o ID ou '' se não encontrar ou encontrar mais de um.
 */
function buscarEquipamentoIdPorLocalizacao(localizacao) {
  const localizacaoBuscada = String(localizacao || '').trim().toLowerCase();
  if (!localizacaoBuscada) return '';

  const dados = ReadEquipments();
  const encontrados = dados.filter(linha => String(linha[1] || '').trim().toLowerCase() === localizacaoBuscada);

  return (encontrados.length === 1) ? encontrados[0][0] : '';
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
  const novaLinha = [novoId, chamadoId, texto, dataAtual];
  abaHistorico.getRange(ultimaLinha + 1, 1, 1, numColumnsTicketHistorico).setValues([novaLinha]);
}
