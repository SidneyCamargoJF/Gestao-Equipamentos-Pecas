let ticketsTableName = 'tbl_chamados'
let firstLineTickets = 3
let numColumnsTickets = 16

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
let ticketsAbertoPorCol = 8
let ticketsAtribuidoCol = 9
let ticketsDtInicioAndamentoCol = 10
let ticketsDtFinalizacaoCol = 11
let ticketsObservacaoCol = 12
let ticketsRelatorioCol = 13
let ticketsNotaFiscalCol = 14
let ticketsStatusCol = 15
let ticketsDtAlteracaoCol = 16

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

  // A coluna DATA (índice 3) usa dateTimeToString (com hora) -- o Sheets
  // converte o texto "dd/MM/yyyy HH:mm" gravado em Date sozinho, e se a
  // gente formatar de volta só com dateToString a hora desaparece.
  return objRows.map(linha =>
    linha.map((valor, idx) => {
      if (!(valor instanceof Date)) return valor
      return (idx === ticketHistoricoDataCol - 1) ? dateTimeToString(valor) : dateToString(valor)
    })
  )
}
