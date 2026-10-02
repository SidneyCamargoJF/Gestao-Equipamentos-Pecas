let ticketsTableName = 'tbl_chamados'
let firstLineTickets = 3
let numColumnsTickets = 13

let ticketsIdCol = 1
let ticketsEquipamentoIdCol = 2
let ticketsReasonCol = 3
let ticketsTypeCol = 4
let ticketsPriorityCol = 5
let ticketsDtAberturaCol = 6
let ticketsAbertoPorCol = 7
let ticketsAtribuidoCol = 8
let ticketsDtInicioAndamentoCol = 9
let ticketsDtFinalizacaoCol = 10
let ticketsObservacaoCol = 11
let ticketsStatusCol = 12
let ticketsDtAlteracaoCol = 13

function ReadTickets() {
  const objRows = ReadSheet(ticketsTableName, firstLineTickets, numColumnsTickets)

  return objRows.map(linha =>
    linha.map(valor => (valor instanceof Date) ? dateToString(valor) : valor)
  )
}

// ===== tbl_chamado_historico =====
let ticketHistoricoTableName = 'tbl_chamado_historico'
let firstLineTicketHistorico = 3
let numColumnsTicketHistorico = 5

let ticketHistoricoIdCol = 1
let ticketHistoricoChamadoIdCol = 2
let ticketHistoricoTextoCol = 3
let ticketHistoricoDataCol = 4
let ticketHistoricoDataAlteracaoCol = 5

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


// ===== tbl_chamado_anexos =====
let ticketAnexosTableName = 'tbl_chamado_anexos'
let firstLineTicketAnexos = 3
let numColumnsTicketAnexos = 8

let ticketAnexosIdCol = 1
let ticketAnexosIdChamadoCol = 2
let ticketAnexosTipoCol = 3
let ticketAnexosNomeArquivoCol = 4
let ticketAnexosUrlCol = 5
let ticketAnexosHashCol = 6
let ticketAnexosDataUploadCol = 7
let ticketAnexosDataExclusaoCol = 8

function ReadTicketAnexos() {
  const objRows = ReadSheet(ticketAnexosTableName, firstLineTicketAnexos, numColumnsTicketAnexos)

  return objRows.map(linha =>
    linha.map((valor, idx) => {
      if (!(valor instanceof Date)) return valor
      return (idx === ticketAnexosDataUploadCol - 1) ? dateTimeToString(valor) : dateToString(valor)
    })
  )
}
