let PartsTableName = 'tbl_pecas'
let firstLineParts  = 3
let numColumnsParts = 19

let partsIdCol = 0
let partsNameCol  = 1
let partsBrandCol = 2
let partsModelCol = 3
let partsCapacityCol = 4
let partsNSCol = 5
let partsLocalCol = 6
let partsSuplierCol = 7
let partsNumNFCol = 8
let partsDtNFCol = 9
let partsGarantiaCol = 10
let partsDtGarantiaCol = 11
let partsModalidadeCol = 12
let partsValueCol = 13
let partsSEINumCol = 14
let partsDtCadastroCol = 15
let partsDtAlteracaoCol = 16
let partsDtExclusaoCol = 17
// S -- 'peca' | 'produto' (produto adquirido do estoque); vazio = peça.
// Coluna nova, no fim da aba.
let partsTipoCol = 18

// 'produto' ou 'peca' (padrão)
function tipoItemEstoque_(valor) {
  return String(valor || '').trim().toLowerCase() === 'produto' ? 'produto' : 'peca'
}

function ReadParts() {

  objRows = ReadSheet(PartsTableName, firstLineParts, numColumnsParts)

  return objRows
}
// Encontrar a marca a partir do id 


