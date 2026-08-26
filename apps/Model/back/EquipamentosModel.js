let equipTableName = 'tbl_equipamentos'
let firstLineEquipments = 3
let numColumnsEquipments = 9

let equipIdCol = 1
let equipLocalizacaoCol = 2
let equipBtusCol = 3
let equipMarcaCol = 4
let equipModeloCol = 5
let equipPatrimonioCol = 6
let equipSequenciaCol = 7
let equipDtCadastroCol = 8
let equipDtAlteracaoCol = 9

function ReadEquipments() {
  const objRows = ReadSheet(equipTableName, firstLineEquipments, numColumnsEquipments)

  return objRows.map(linha =>
    linha.map(valor => (valor instanceof Date) ? dateToString(valor) : valor)
  )
}
