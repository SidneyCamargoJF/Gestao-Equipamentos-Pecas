// =====================================================
// MODEL - tbl_contratos_produtos
// Produtos fornecidos pelo contrato.
// Constantes 0-based (índice direto no array do Read*(); use col + 1
// em getRange).
// =====================================================

let contractsProdutosTableName = 'tbl_contratos_produtos'
let firstLineContractsProdutos = 3
let numColumnsContractsProdutos = 5

let contractsProdutosIdCol = 0
let contractsProdutosIdContratoCol = 1
let contractsProdutosNomeCol = 2
let contractProdutosDataCadastroCol = 3
let contractsProdutosDataExclusaoCol = 4

function ReadContractsProdutos() {
  const objRows = ReadSheet(contractsProdutosTableName, firstLineContractsProdutos, numColumnsContractsProdutos)

  return objRows.map(linha =>
    linha.map(valor => (valor instanceof Date) ? dateToString(valor) : valor)
  )
}
