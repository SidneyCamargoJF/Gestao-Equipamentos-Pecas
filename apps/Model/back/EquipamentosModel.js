let equipTableName = 'tbl_equipamentos'
let firstLineEquipments = 3
let numColumnsEquipments = 12

let equipIdCol = 1
let equipNomeCol = 2
let equipMarcaCol = 3
let equipCapacidadeCol = 4
let equipModeloCol = 5
let equipPatrimonioCol = 6
let equipSequenciaCol = 7
let equipLocalizacaoCol = 8
let equipActiveCol = 9
let equipDtCadastroCol = 10
let equipDtAlteracaoCol = 11
let equipDtExclusaoCol = 12

function ReadEquipments() {
  const objRows = ReadSheet(equipTableName, firstLineEquipments, numColumnsEquipments)

  return objRows.map(linha =>
    linha.map(valor => (valor instanceof Date) ? dateToString(valor) : valor)
  )
}
