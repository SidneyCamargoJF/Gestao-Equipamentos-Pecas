let contractTableName = 'tbl_contratos'
let firstLineContracts = 3
let numColumnsContracts = 19

let contractIdCol = 0
let contractNumberCol = 1
let contratctNameCol = 2
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
let contractDataAletracaoCol = 17
let contractDataExclusaoCol = 18


function ReadContracts() {
  return ReadSheet(contractTableName, firstLineContracts, numColumnsContracts)
}

function findContractId(id) {
  return FindContext(contractTableName, id, firstLineContracts, numColumnsContracts)
}

// ===== tbl_contratos_anexos =====
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

// ===== tbl_contratos_equipamentos =====
let contractsEquipamentsTableName = 'tbl_contratos_equipamentos'
let firstLineContractsEquipaments = 3
let numColumnsContractsEquipaments = 5

let contractsEquipamentsIdCol = 0
let contractsEquipamentsIdContratoCol = 1
let contractEquipamentsIdEquipamentCol = 2
let contractEquipamentsDataCadastroCol = 3
let contractsEquipamentsDataExclusaoCol = 4

function ReadContractsEquipaments() {
  const objRows = ReadSheet(contractsEquipamentsTableName, firstLineContractsEquipaments, numColumnsContractsEquipaments)

  return objRows.map(linha =>
    linha.map(valor => (valor instanceof Date) ? dateToString(valor) : valor)
  )
}

// ===== tbl_contratos_servicos =====
let contractsServicosTableName = 'tbl_contratos_servicos'
let firstLineContractsServicos = 3
let numColumnsContractsServicos = 6

let contractsServicosIdCol = 0
let contractsServicosIdContratoCol = 1
let contractsServicosNomeCol = 2
let contractServicosDataCadastroCol = 3
let contractsServicosDataExclusaoCol = 4
let contractsServicosDataAlteracaoCol = 5

function ReadContractsServicos() {
  const objRows = ReadSheet(contractsServicosTableName, firstLineContractsServicos, numColumnsContractsServicos)

  return objRows.map(linha =>
    linha.map(valor => (valor instanceof Date) ? dateToString(valor) : valor)
  )
}

// ===== tbl_contratos_produtos =====
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

// ===== tbl_contratos_checkList =====
let contractsCheckListTableName = 'tbl_contratos_checkList'
let firstLineContractsCheckList = 3
let numColumnsContractsCheckList = 6

let contractsCheckListIdCol = 0
let contractsCheckListIdContratoCol = 1
let contractsCheckListNomeCol = 2
let contractCheckListDataCadastroCol = 3
let contractsCheckListDataExclusaoCol = 4
let contractsCheckListDataAlteracaoCol = 5

function ReadContractsCheckList() {
  const objRows = ReadSheet(contractsCheckListTableName, firstLineContractsCheckList, numColumnsContractsCheckList)

  return objRows.map(linha =>
    linha.map(valor => (valor instanceof Date) ? dateToString(valor) : valor)
  )
}
