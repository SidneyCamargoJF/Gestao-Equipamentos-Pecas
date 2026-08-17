let supplierTableName = 'tbl_fornecedor'
let firstLineSupplier  = 3
let numColumnsupplier = 20

let supplierIdCol = 1
let supplierRazaoSocialCol = 2
let supplierNameCol = 3
let supplierCNPJCol = 4
let supplierInscEstadualCol = 5
let supplierInscMunicipalCol = 6
let supplierEmailCol = 7
let supplierTelefoneCol = 8
let supplierCelularCol = 9
let supplierWhatsappCol = 10
let supplierCEPCol = 11
let supplierLogradouroCol = 12
let supplierNumeroCol = 13
let supplierBairroCol = 14
let supplierCidadeCol = 15
let supplierEstadoCol = 16
let supplierComplementoCol = 17
let supplierDtCadastroCol = 18
let supplierDtAlteracaoCol = 19
let supplierStatusCol = 20

function ReadSuppliers() {

  const dados = ReadSheet(supplierTableName, 3, 14)

  return dados.map(linha =>
    linha.map(valor => (valor instanceof Date) ? dateToString(valor) : valor)
  );
}


