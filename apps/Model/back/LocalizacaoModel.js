let LocalTableName = 'tbl_localizacao'
let firstLineLocal  = 3
let numColumnsLocal = 5

let localIdCol = 1
let localNameCol = 2
let localDtCadastroCol = 3
let LocalDtExclusaoCol = 4
let LocalDtAlteracao = 5

function ReadLocations() {

  return ReadSheet('tbl_localizacao', 3, 2)
}


