let userTableName = 'tbl_usuarios'
let firstLineUsers = 3
let numColumnsUsers = 8

// Ordem real da aba: ID, MATRICULA, USUARIO, NOME, LOTACAO, SETOR,
// DATA_CADASTRO, DATA_EXCLUSAO. USUARIO = login Google (e-mail) usado pra
// identificar quem está logado (Session.getActiveUser().getEmail()).
let userIdCol = 0
let userMatriculaCol = 1
let userUsuarioCol = 2
let userNomeCol = 3
let userLotacao = 4
let userSetorCol = 5
let userDtCadastroCol = 6
let userDtExclusaoCol = 7

function ReadUsers() {

  const objRows = ReadSheet(userTableName, firstLineUsers, numColumnsUsers)

  objRows.forEach( item => {
    item[userDtCadastroCol] = isEmpty( item[userDtCadastroCol] ) ? "" : dateToString(item[userDtCadastroCol])
    item[userDtExclusaoCol] = isEmpty( item[userDtExclusaoCol] ) ? "" : dateToString(item[userDtExclusaoCol])
  })

  return objRows
}
