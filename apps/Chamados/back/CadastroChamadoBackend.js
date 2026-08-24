// =====================================================
// BACKEND (Apps Script) - CADASTRO DE CHAMADO
// Chamado pelo cliente (CadastroChamadoFormJS) via google.script.run
// =====================================================

/**
 * Salva um novo chamado em tbl_chamados, grava a árvore de itens associados
 * em tbl_chamado_itens (se houver) e registra a abertura em
 * tbl_chamado_historico. Local/Capacidade/Marca/Patrimônio/Seq ainda não são
 * coletados no formulário (aguardando o cadastro de Equipamentos ficar
 * pronto), então por enquanto entram em branco.
 *
 * Retorna { sucesso: boolean, mensagem: string, id?: number }
 */
function salvarChamadoBackend(dados) {
  try {
    if (!dados || !String(dados.motivo || '').trim()) {
      return { sucesso: false, mensagem: 'Preencha o motivo do chamado.' };
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

    // Ordem: ID, LOCAL, CAPACIDADE, MARCA, PATRIMONIO, SEQ, DEFEITO, TIPO,
    // PRIORIDADE, DATA_ABERTURA, ATRIBUIDO, DATA_INICIO_ATENDIMENTO,
    // DATA_FINALIZACAO, OBSERVACAO, RELATORIO, NOTA_FISCAL, STATUS, DT_ALTERACAO
    const novaLinha = [
      novoId,
      dados.local || '',
      dados.capacidade || '',
      dados.marca || '',
      dados.patrimonio || '',
      dados.seq || '',
      dados.motivo,
      dados.tipo || '',
      dados.classificacao || '',
      dados.dataAbertura || dataAtual,
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

    if (dados.itens && dados.itens.length > 0) {
      salvarItensChamado(novoId, dados.itens, '');
    }

    adicionarHistoricoChamado(novoId, 'Chamado aberto');

    return { sucesso: true, mensagem: 'Chamado aberto com sucesso!', id: novoId };
  } catch (e) {
    return { sucesso: false, mensagem: 'Erro no servidor: ' + e.message };
  }
}

/**
 * Grava recursivamente a árvore de itens (equipamento -> peças, ou peça
 * avulsa) em tbl_chamado_itens. paiId vazio = item raiz.
 */
function salvarItensChamado(chamadoId, itens, paiId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const abaItens = ss.getSheetByName(ticketItensTableName);
  if (!abaItens) return;

  itens.forEach(item => {
    const ultimaLinhaPlanilha = abaItens.getLastRow();
    const ultimaLinha = Math.max(ultimaLinhaPlanilha, firstLineTicketItens - 1);

    let idAtual = (ultimaLinha >= firstLineTicketItens) ? abaItens.getRange(ultimaLinha, 1).getValue() : 0;
    if (idAtual === '' || isNaN(Number(idAtual))) idAtual = 0;
    const novoItemId = Number(idAtual) + 1;

    const novaLinha = [novoItemId, chamadoId, item.tipo, item.nome || '', paiId || ''];
    abaItens.getRange(ultimaLinha + 1, 1, 1, numColumnsTicketItens).setValues([novaLinha]);

    if (item.filhos && item.filhos.length > 0) {
      salvarItensChamado(chamadoId, item.filhos, novoItemId);
    }
  });
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
