// =====================================================
// SETUP DE TABELAS NOVAS -- rodar UMA VEZ pelo editor do Apps Script
// (Extensões > Apps Script, escolher "criarTabelasNovasSeNecessario" no
// menu de funções lá no topo e clicar em Executar).
//
// Algumas tabelas foram adicionadas só no código (modelo/colunas), mas a
// aba correspondente pode não existir ainda nesta planilha -- a LEITURA
// não quebra nesse caso (ReadSheetSeExistir devolve [] em vez de erro),
// mas o SALVAMENTO falha (às vezes calado, como era o caso do SLA do
// contrato -- a pessoa digitava o SLA, salvava, e ele simplesmente não
// ia pra lugar nenhum, sem aviso nenhum).
//
// Essa função cria qualquer uma dessas abas que ainda não existir, com o
// cabeçalho certo (mesma ordem de coluna que o Model.js espera). Se a aba
// já existir, não faz nada com ela (não sobrescreve, não duplica).
// =====================================================
function criarTabelasNovasSeNecessario() {
  const resultado = [
    criarAbaSeNaoExistir_(contractsSlaTableName, [
      'ID', 'CONTRATO_ID', 'PRIORIDADE', 'PRAZO_ATENDIMENTO_HORAS', 'PRAZO_SOLUCAO_HORAS',
      'HORAS_UTEIS', 'DATA_CADASTRO', 'DATA_ALTERACAO', 'DATA_EXCLUSAO'
    ]),
    criarAbaSeNaoExistir_(ticketChecklistTableName, [
      'ID', 'CHAMADO_ID', 'EQUIPAMENTO_ID', 'CHECKLIST_ID', 'DESCRICAO', 'PERIODICIDADE',
      'RESULTADO', 'OBSERVACAO', 'EXECUTADO_EM', 'REGISTRADO_POR', 'DATA_CADASTRO',
      'DATA_ALTERACAO', 'DATA_EXCLUSAO'
    ]),
    // modelos de e-mail (Configuração > Modelos de e-mail), já com os modelos iniciais
    garantirAbaModelosEmail_(),
    // e-mails enviados por chamado (Reenviar e-mail)
    criarAbaSeNaoExistir_(ticketEmailsTableName, CABECALHO_CHAMADO_EMAILS)
  ];

  resultado.forEach(function (r) { Logger.log(r.mensagem); });
  return resultado;
}

/**
 * Cria a aba se ela não existir, com o cabeçalho na linha 2 (dados
 * começam na linha 3, igual o resto da planilha). Não toca numa aba que
 * já existe.
 */
function criarAbaSeNaoExistir_(nomeAba, cabecalhos) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let aba = ss.getSheetByName(nomeAba);
  if (aba) {
    return { sucesso: true, criada: false, mensagem: "Aba '" + nomeAba + "' já existia -- nada a fazer." };
  }

  aba = ss.insertSheet(nomeAba);
  aba.getRange(2, 1, 1, cabecalhos.length).setValues([cabecalhos]);
  aba.getRange(2, 1, 1, cabecalhos.length).setFontWeight('bold');
  aba.setFrozenRows(2);

  return { sucesso: true, criada: true, mensagem: "Aba '" + nomeAba + "' criada com sucesso." };
}
