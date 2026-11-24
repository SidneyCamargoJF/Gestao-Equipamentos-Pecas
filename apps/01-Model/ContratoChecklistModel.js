// =====================================================
// MODEL - tbl_contratos_Checklist
// Itens do checklist do contrato, com a periodicidade de cada um.
// Constantes 0-based (índice direto no array do Read*(); use col + 1
// em getRange).
// =====================================================

let contractsChecklistTableName = 'tbl_contratos_Checklist'
let firstLineContractsChecklist = 3
let numColumnsContractsChecklist = 10

let contractsChecklistIdCol = 0
let contractsChecklistIdContratoCol = 1
let contractsChecklistNomeCol = 2
let contractChecklistDataCadastroCol = 3
let contractsChecklistDataExclusaoCol = 4
let contractsChecklistDataAlteracaoCol = 5
let contractsChecklistPeriodicidadeCol = 6   // G
let contractsChecklistServicoIdCol = 7       // H
// Equipamento a que o item se aplica (vazio = todos os equipamentos do
// contrato). Mesma regra do serviço: CATEGORIA = NOME do equipamento,
// TIPO = MODELO, sem diferenciar maiúsculas.
let contractsChecklistCategoriaCol = 8       // I
let contractsChecklistTipoCol = 9            // J

function ReadContractsChecklist() {
  const objRows = ReadSheet(contractsChecklistTableName, firstLineContractsChecklist, numColumnsContractsChecklist)

  return objRows.map(linha =>
    linha.map(valor => (valor instanceof Date) ? dateToString(valor) : valor)
  )
}
