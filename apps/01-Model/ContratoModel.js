let contractTableName = 'tbl_contratos'
let firstLineContracts = 3
let numColumnsContracts = 21

let contractIdCol = 0
let contractNumberCol = 1
let contractNameCol = 2
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
let contractSituacaoCol = 17
let contractDataAletracaoCol = 18
let contractDataExclusaoCol = 19
let contractDataBasePreventivaCol = 20   // U -- início do ciclo das preventivas


function ReadContracts() {
  const objRows = ReadSheet(contractTableName, firstLineContracts, numColumnsContracts)

  return objRows.map(linha =>
    linha.map(valor => (valor instanceof Date) ? dateToString(valor) : valor)
  )
}


function findContractId(id) {
  return FindContext(contractTableName, id, firstLineContracts, numColumnsContracts)
}
