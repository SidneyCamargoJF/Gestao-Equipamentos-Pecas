let supplierTableName = 'tbl_fornecedor'
let firstLineSupplier  = 3
let numColumnsupplier = 22

// Ordem real das colunas na planilha (reorganizada pelo usuário: Prestador/
// Distribuidor logo após o ID, datas de cadastro/alteração quase no final,
// Status por último).
let supplierIdCol = 1
let supplierPrestadorServicoCol = 2
let supplierDistribuidorProdutosCol = 3
let supplierRazaoSocialCol = 4
let supplierNameCol = 5
let supplierCNPJCol = 6
let supplierInscEstadualCol = 7
let supplierInscMunicipalCol = 8
let supplierEmailCol = 9
let supplierTelefoneCol = 10
let supplierCelularCol = 11
let supplierWhatsappCol = 12
let supplierCEPCol = 13
let supplierLogradouroCol = 14
let supplierNumeroCol = 15
let supplierBairroCol = 16
let supplierCidadeCol = 17
let supplierEstadoCol = 18
let supplierComplementoCol = 19
let supplierDtCadastroCol = 20
let supplierDtAlteracaoCol = 21
let supplierStatusCol = 22

function ReadSuppliers() {

  const dados = ReadSheet(supplierTableName, firstLineSupplier, numColumnsupplier)

  return dados.map(linha =>
    linha.map(valor => (valor instanceof Date) ? dateToString(valor) : valor)
  );
}


