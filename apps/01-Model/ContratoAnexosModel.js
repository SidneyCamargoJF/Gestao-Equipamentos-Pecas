// =====================================================
// MODEL - tbl_contratos_anexos
// Documentos anexados ao contrato (arquivos no Drive).
// Constantes 0-based (índice direto no array do Read*(); use col + 1
// em getRange).
// =====================================================

let contractsAnexosTableName = 'tbl_contratos_anexos'
let firstLineContractsAnexos = 3
let numColumnsContractsAnexos = 8

let contractsAnexosIdCol = 0
let contractsAnexosIdContratoCol = 1
let contractsAnexosTipoCol = 2
let contractsAnexosNomeArquivoCol = 3
let contractsAnexosUrlCol = 4
let contractsAnexosHashCol = 5
let contractsAnexosDataUploadCol = 6
let contractsAnexosDataExclusaoCol = 7

function ReadContractsAnexos() {
  const objRows = ReadSheet(contractsAnexosTableName, firstLineContractsAnexos, numColumnsContractsAnexos)

  return objRows.map(linha =>
    linha.map((valor, idx) => {
      if (!(valor instanceof Date)) return valor
      return (idx === contractsAnexosDataUploadCol) ? dateTimeToString(valor) : dateToString(valor)
    })
  )
}
