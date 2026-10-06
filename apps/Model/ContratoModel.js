let contractTableName = 'tbl_contrato'
let firstLineContracts = 3
let numColumnsContracts = 19

let contractIdCol = 0
let contractNumberCol = 1
let contratctNameCol = 2
let contractDataRenovacao = 3
let contractSEICol = 4
let contractDataFechamentoCol = 5
let contractEmpresaCol = 6
let contractObjetoCol = 7
let contractObservacoesCol = 8
let contractValorCol = 9
let contractDataInicialCol = 10
let contractDataFinalCol = 11
let contractDataFinalPrevistaCol = 12
let contractContatoEmpresaCol = 13
let contractTelefoneCol = 14
let contractEmailCol = 15
let contractGestorCol = 16
let contractActiveCol = 17
let contractDataAletracaoCol = 18
let contractDataExclusaoCol = 19


function ReadContracts() {
  return ReadSheet(contractTableName, firstLineContracts, numColumnsContracts)
}

function findContractId(id) {
  return FindContext(contractTableName, id, firstLineContracts, numColumnsContracts)
}

