let ticketsTableName = 'tbl_chamados'
let firstLineTickets = 3
let numColumnsTickets = 18

// Colunas base-1 (mesmo padrão de FornecedorModel.js/PecasModel.js -- usadas
// direto em getRange(linha, coluna), que no Apps Script começa em 1).
let ticketsIdCol = 1
let ticketsLocalCol = 2
let ticketsCapacityCol = 3
let ticketsBrandCol = 4
let ticketsPatCol = 5
let ticketsSequenceCol = 6
let ticketsReasonCol = 7
let ticketsTypeCol = 8
let ticketsPriorityCol = 9
let ticketsDtAberturaCol = 10
let ticketsAtribuidoCol = 11
let ticketsDtInicioAndamentoCol = 12
let ticketsDtFinalizacaoCol = 13
let ticketsObservacaoCol = 14
let ticketsRelatorioCol = 15
let ticketsNotaFiscalCol = 16
let ticketsStatusCol = 17
let ticketsDtAlteracaoCol = 18

function ReadTickets() {
  const objRows = ReadSheet(ticketsTableName, firstLineTickets, numColumnsTickets)

  return objRows.map(linha =>
    linha.map(valor => (valor instanceof Date) ? dateToString(valor) : valor)
  )
}

// ===== tbl_chamado_itens (árvore de equipamento/peça associados) =====
let ticketItensTableName = 'tbl_chamado_itens'
let firstLineTicketItens = 3
let numColumnsTicketItens = 5

let ticketItemIdCol = 1
let ticketItemChamadoIdCol = 2
let ticketItemTipoCol = 3
let ticketItemNomeCol = 4
let ticketItemPaiIdCol = 5

function ReadTicketItens() {
  return ReadSheet(ticketItensTableName, firstLineTicketItens, numColumnsTicketItens)
}

// ===== tbl_chamado_historico (linha do tempo de estados do chamado) =====
let ticketHistoricoTableName = 'tbl_chamado_historico'
let firstLineTicketHistorico = 3
let numColumnsTicketHistorico = 4

let ticketHistoricoIdCol = 1
let ticketHistoricoChamadoIdCol = 2
let ticketHistoricoTextoCol = 3
let ticketHistoricoDataCol = 4

function ReadTicketHistorico() {
  const objRows = ReadSheet(ticketHistoricoTableName, firstLineTicketHistorico, numColumnsTicketHistorico)

  return objRows.map(linha =>
    linha.map(valor => (valor instanceof Date) ? dateToString(valor) : valor)
  )
}
