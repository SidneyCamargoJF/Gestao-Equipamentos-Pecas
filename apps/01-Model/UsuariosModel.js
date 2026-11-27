let userTableName = 'tbl_usuarios'
let firstLineUsers = 3
let numColumnsUsers = 17

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
let userEmailCol = 8          // I -- e-mail de contato (coluna nova, no fim da aba)
let userTelefoneCol = 9       // J -- telefone / ramal (coluna nova, no fim da aba)
// Login (apps/Controller/Login/back/LoginBackend.js) -- colunas novas, no fim da aba:
let userSenhaHashCol = 10     // K -- hash da senha (SHA-256 com sal, várias rodadas; nunca a senha)
let userSenhaSalCol = 11      // L -- sal da senha
let userGrupoCol = 12         // M -- administrador | diretor | usuario (vazio: ADMINS -> administrador, senão usuario)
let userAtivoCol = 13         // N -- S | N (vazio = S); cadastro pela tela de login entra N até a liberação
let userCodigoSenhaCol = 14   // O -- hash do código de "esqueci minha senha"
let userCodigoExpiraCol = 15  // P -- validade do código (ms desde 1970)
let userUltimoAcessoCol = 16  // Q -- último login (dd/MM/yyyy HH:mm)

function ReadUsers() {

  const objRows = ReadSheet(userTableName, firstLineUsers, numColumnsUsers)

  objRows.forEach( item => {
    item[userDtCadastroCol] = isEmpty( item[userDtCadastroCol] ) ? "" : dateToString(item[userDtCadastroCol])
    item[userDtExclusaoCol] = isEmpty( item[userDtExclusaoCol] ) ? "" : dateToString(item[userDtExclusaoCol])
  })

  return objRows
}
