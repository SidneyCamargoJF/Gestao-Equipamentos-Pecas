let contractTableName = 'tbl_contrato'
let firstLineContracts = 3
let numColumnsContracts = 19

let contractIdCol = 0
let contractNumberCol = 1
let contratctNameCol = 2
let contractDataEncerramento = 3
let contractSEICol = 4
let contractDataFechamentoCol = 5
let contractEmpresaCol = 6
let contractObjetoCol = 7
let contractObservacoesCol = 8
let contractValorCol = 9
let contractDataInicialCol = 10
let contractDataFinalCol = 11
let contractContatoEmpresaCol = 12
let contractTelefoneCol = 13
let contractEmailCol = 14
let contractGestorCol = 15
let contractActiveCol = 16
let contractDataAletracaoCol = 17
let contractDataExclusaoCol = 18


function ReadContracts() {
  return ReadSheet(contractTableName, firstLineContracts, numColumnsContracts)
}

function findContractId(id) {
  return FindContext(contractTableName, id, firstLineContracts, numColumnsContracts)
}

