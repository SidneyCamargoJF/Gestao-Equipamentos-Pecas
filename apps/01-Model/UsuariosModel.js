let userTableName = 'tbl_usuarios'
let firstLineUsers = 3
let numColumnsUsers = 7

let userIdCol = 0
let userMatriculaCol = 1
let userNomeCol = 2
let userLotacao = 3
let userSetorCol = 4
let userDtCadastroCol = 5
let userDtExclusaoCol = 6

function ReadUsers() {

  const objRows = ReadSheet(userTableName, firstLineUsers, numColumnsUsers)

  objRows.forEach( item => {
    item[userDtCadastroCol] = isEmpty( item[userDtCadastroCol] ) ? "" : dateToString(item[userDtCadastroCol])
    item[userDtExclusaoCol] = isEmpty( item[userDtExclusaoCol] ) ? "" : dateToString(item[userDtExclusaoCol])
  })

  return objRows
}
