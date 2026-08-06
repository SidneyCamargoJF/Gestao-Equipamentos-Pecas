let PartsTableName = 'tbl_pecas'
let firstLineParts  = 3
let numColumnsParts = 17

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

function ReadParts() {

  objRows = ReadSheet(PartsTableName, firstLineParts, numColumnsParts)

  return objRows
}
// Encontrar a marca a partir do id 


