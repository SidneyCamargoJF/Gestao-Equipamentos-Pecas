let ticketsTableName = 'tbl_chamados'
let firstLineTickets = 3
let numColumnsTickets = 21

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
// Colunas novas (criadas no fim da aba -- as 13 acima não mudaram de lugar)
let ticketsContratoIdCol = 14
let ticketsOrigemCol = 15             // 'manual' | 'automatica'
let ticketsCompetenciaCol = 16        // 'AAAA-MM' (gravada como texto)
let ticketsDataPrevistaCol = 17       // dd/MM/yyyy
let ticketsPrazoAtendimentoCol = 18   // dd/MM/yyyy HH:mm
let ticketsPrazoSolucaoCol = 19       // dd/MM/yyyy HH:mm
let ticketsFornecedorIdCol = 20
let ticketsDtExclusaoCol = 21

function ReadTickets() {
  const objRows = ReadSheet(ticketsTableName, firstLineTickets, numColumnsTickets)

  return objRows.map(linha =>
    linha.map((valor, idx) => {
      if (!(valor instanceof Date)) return valor
      // Prazos têm hora; competência é só ano-mês (caso o Sheets tenha
      // convertido o texto "2026-01" em data).
      if (idx === ticketsPrazoAtendimentoCol - 1 || idx === ticketsPrazoSolucaoCol - 1) return dateTimeToString(valor)
      if (idx === ticketsCompetenciaCol - 1) return Utilities.formatDate(valor, Session.getScriptTimeZone(), 'yyyy-MM')
      return dateToString(valor)
    })
  )
}

// Texto que o Sheets converteria sozinho (ex.: "2026-01" vira data) --
// o apóstrofo força a célula a guardar texto e não aparece no valor lido.
function textoLiteralPlanilha(valor) {
  const s = String(valor === null || valor === undefined ? '' : valor)
  return s ? "'" + s : ''
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

// ===== tbl_chamado_checklist =====
// Itens do checklist a executar numa OS (chamado), um por equipamento x item.
// Constantes 1-based, como o resto deste arquivo (índice no array = col - 1).
let ticketChecklistTableName = 'tbl_chamado_checklist'
let firstLineTicketChecklist = 3
let numColumnsTicketChecklist = 13

let ticketChecklistIdCol = 1
let ticketChecklistChamadoIdCol = 2
let ticketChecklistEquipamentoIdCol = 3
let ticketChecklistChecklistIdCol = 4
let ticketChecklistDescricaoCol = 5
let ticketChecklistPeriodicidadeCol = 6
let ticketChecklistResultadoCol = 7     // pendente | ok | nao_conforme | nao_aplicavel
let ticketChecklistObservacaoCol = 8
let ticketChecklistExecutadoEmCol = 9   // dd/MM/yyyy HH:mm
let ticketChecklistRegistradoPorCol = 10
let ticketChecklistDataCadastroCol = 11
let ticketChecklistDataAlteracaoCol = 12
let ticketChecklistDataExclusaoCol = 13

const RESULTADOS_CHECKLIST_CHAMADO = ['pendente', 'ok', 'nao_conforme', 'nao_aplicavel']

function ReadTicketChecklist() {
  const objRows = ReadSheetSeExistir(ticketChecklistTableName, firstLineTicketChecklist, numColumnsTicketChecklist)

  return objRows.map(linha =>
    linha.map((valor, idx) => {
      if (!(valor instanceof Date)) return valor
      return (idx === ticketChecklistExecutadoEmCol - 1) ? dateTimeToString(valor) : dateToString(valor)
    })
  )
}
