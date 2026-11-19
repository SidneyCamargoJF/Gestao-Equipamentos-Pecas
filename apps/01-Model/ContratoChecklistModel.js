// =====================================================
// MODEL - tbl_contratos_Checklist
// Itens do checklist do contrato, com a periodicidade de cada um.
// Constantes 0-based (índice direto no array do Read*(); use col + 1
// em getRange).
// =====================================================

let contractsChecklistTableName = 'tbl_contratos_Checklist'
let firstLineContractsChecklist = 3
let numColumnsContractsChecklist = 8

let contractsChecklistIdCol = 0
let contractsChecklistIdContratoCol = 1
let contractsChecklistNomeCol = 2
let contractChecklistDataCadastroCol = 3
let contractsChecklistDataExclusaoCol = 4
let contractsChecklistDataAlteracaoCol = 5
let contractsChecklistPeriodicidadeCol = 6   // G
let contractsChecklistServicoIdCol = 7       // H

function ReadContractsChecklist() {
  const objRows = ReadSheet(contractsChecklistTableName, firstLineContractsChecklist, numColumnsContractsChecklist)

  return objRows.map(linha =>
    linha.map(valor => (valor instanceof Date) ? dateToString(valor) : valor)
  )
}
