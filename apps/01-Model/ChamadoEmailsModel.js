// ===== tbl_chamado_emails =====
// E-mails enviados pelo sistema para a empresa (um por envio), guardados
// para o "Reenviar e-mail" da edição do chamado. Criada sozinha no 1º envio.
// Ordem (1-based, igual às outras tabelas do chamado):
let ticketEmailsTableName = 'tbl_chamado_emails'
let firstLineTicketEmails = 3
let numColumnsTicketEmails = 9

let ticketEmailIdCol = 1
let ticketEmailChamadoIdCol = 2
let ticketEmailParaCol = 3
let ticketEmailCcCol = 4
let ticketEmailAssuntoCol = 5
let ticketEmailCorpoCol = 6
let ticketEmailEnviadoEmCol = 7     // dd/MM/yyyy HH:mm
let ticketEmailEnviadoPorCol = 8
let ticketEmailDtExclusaoCol = 9

const CABECALHO_CHAMADO_EMAILS = ['ID', 'CHAMADO_ID', 'PARA', 'CC', 'ASSUNTO', 'CORPO', 'ENVIADO_EM', 'ENVIADO_POR', 'DATA_EXCLUSAO']

function ReadTicketEmails() {
  return ReadSheetSeExistir(ticketEmailsTableName, firstLineTicketEmails, numColumnsTicketEmails).map(linha =>
    linha.map((valor, idx) => {
      if (!(valor instanceof Date)) return valor
      return (idx === ticketEmailEnviadoEmCol - 1) ? dateTimeToString(valor) : dateToString(valor)
    })
  )
}
