// =====================================================
// MODEL - tbl_contratos_equipamentos
// Equipamentos cobertos pelo contrato (vínculo contrato x equipamento).
// Constantes 0-based (índice direto no array do Read*(); use col + 1
// em getRange).
// =====================================================

let contractsEquipamentsTableName = 'tbl_contratos_equipamentos'
let firstLineContractsEquipaments = 3
let numColumnsContractsEquipaments = 5

let contractsEquipamentsIdCol = 0
let contractsEquipamentsIdContratoCol = 1
let contractEquipamentsIdEquipamentCol = 2
let contractEquipamentsDataCadastroCol = 3
let contractsEquipamentsDataExclusaoCol = 4

function ReadContractsEquipaments() {
  const objRows = ReadSheet(contractsEquipamentsTableName, firstLineContractsEquipaments, numColumnsContractsEquipaments)

  return objRows.map(linha =>
    linha.map(valor => (valor instanceof Date) ? dateToString(valor) : valor)
  )
}
