let ticketsTableName = 'tbl_chamados'
let firstLineTickets = 3
let numColumnsTickets = 15

// Colunas base-1 (mesmo padrão de FornecedorModel.js/PecasModel.js -- usadas
// direto em getRange(linha, coluna), que no Apps Script começa em 1).
// Por chamado: no máximo 1 equipamento + 1 peça, guardados por ID (chave
// estrangeira pra tbl_equipamentos/tbl_pecas -- nunca duplica o dado aqui).
let ticketsIdCol = 1
let ticketsEquipamentoIdCol = 2
let ticketsPecaIdCol = 3
let ticketsReasonCol = 4
let ticketsTypeCol = 5
let ticketsPriorityCol = 6
let ticketsDtAberturaCol = 7
let ticketsAtribuidoCol = 8
let ticketsDtInicioAndamentoCol = 9
let ticketsDtFinalizacaoCol = 10
let ticketsObservacaoCol = 11
let ticketsRelatorioCol = 12
let ticketsNotaFiscalCol = 13
let ticketsStatusCol = 14
let ticketsDtAlteracaoCol = 15

function ReadTickets() {
  const objRows = ReadSheet(ticketsTableName, firstLineTickets, numColumnsTickets)

  return objRows.map(linha =>
    linha.map(valor => (valor instanceof Date) ? dateToString(valor) : valor)
  )
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
