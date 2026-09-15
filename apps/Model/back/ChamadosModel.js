let ticketsTableName = 'tbl_chamados'
let firstLineTickets = 3
let numColumnsTickets = 15

// Colunas base-1 (mesmo padrão de FornecedorModel.js/PecasModel.js -- usadas
// direto em getRange(linha, coluna), que no Apps Script começa em 1).
// Por chamado: no máximo 1 equipamento, guardado por ID (chave estrangeira
// pra tbl_equipamentos -- nunca duplica o dado aqui). ID_PECA foi removido
// (peça virou texto livre dentro da Descrição, nunca chegou a ser usado).
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
