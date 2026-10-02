let contractTableName = 'tbl_contrato'
let firstLineContracts = 3
let numColumnsContracts = 17

let contractIdCol = 0
let contractNumberCol = 1
let contratctNameCol = 2
let contractSEICol = 3
let contractDateCol = 4
let contractEmpresaCol = 5
let contractObjetoCol = 6
let contractObservacoesCol = 7
let contractValorCol = 8
let contractDataInicialCol = 9
let contractDataFinalCol = 10
let contractContatoEmpresaCol = 11
let contractTelefoneCol = 12
let contractEmailCol = 13
let contractGestorCol = 14
let contractActiveCol = 15
let contractDataAletracaoCol = 16
let contractDataExclusaoCol = 17


function ReadContracts() {
  return ReadSheet(contractTableName, firstLineContracts, numColumnsContracts)
}

function findContractId(id) {
  return FindContext(contractTableName, id, firstLineContracts, numColumnsContracts)
}

