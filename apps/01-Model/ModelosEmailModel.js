// ===== tbl_modelos_email =====
// Modelos de e-mail (Configuração > Modelos de e-mail). O assunto e o corpo
// aceitam campos no formato {{campo}} (ver camposModeloEmail_ no backend),
// trocados pelos dados do chamado na hora de escrever o e-mail.
// Ordem: ID, NOME, ASSUNTO, CORPO, DATA_CADASTRO, DATA_ALTERACAO, DATA_EXCLUSAO
let modelosEmailTableName = 'tbl_modelos_email'
let firstLineModelosEmail = 3
let numColumnsModelosEmail = 7

let modeloEmailIdCol = 0
let modeloEmailNomeCol = 1
let modeloEmailAssuntoCol = 2
let modeloEmailCorpoCol = 3
let modeloEmailDtCadastroCol = 4
let modeloEmailDtAlteracaoCol = 5
let modeloEmailDtExclusaoCol = 6

const CABECALHO_MODELOS_EMAIL = ['ID', 'NOME', 'ASSUNTO', 'CORPO', 'DATA_CADASTRO', 'DATA_ALTERACAO', 'DATA_EXCLUSAO']

function ReadModelosEmail() {
  return ReadSheetSeExistir(modelosEmailTableName, firstLineModelosEmail, numColumnsModelosEmail).map(linha =>
    linha.map(valor => (valor instanceof Date) ? dateToString(valor) : valor)
  )
}
