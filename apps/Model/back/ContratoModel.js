let contractTableName = 'tbl_contrato'
let firstLinecontracts  = 3
let numColumnscontracts = 14

let contractIdCol = 0
let contractNumberCol = 1
let contractSEICol = 2
let contractDateCol = 3
let contractEmpresaCol = 4
let contractTelefoneCol = 5
let contractEMailCol = 6
let contractValueCol = 7
let contractDtInitCol = 8
let contractDtEndCol = 9
let contractRenewed = 10

function ReadContracts() {

  return ReadSheet(contractTableName, firstLineContracts,numColumnsContracts)
}

function  findContractId(id) {
  
  return FindContext(contractTableName, id, firstLineContracts, numColumnscontracts)
}
