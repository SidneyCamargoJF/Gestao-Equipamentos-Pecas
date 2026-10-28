let contractTableName = 'tbl_contratos'
let firstLineContracts = 3
let numColumnsContracts = 20

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


function ReadContracts() {
  const objRows = ReadSheet(contractTableName, firstLineContracts, numColumnsContracts)

  return objRows.map(linha =>
    linha.map(valor => (valor instanceof Date) ? dateToString(valor) : valor)
  )
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
let numColumnsContractsServicos = 9

let contractsServicosIdCol = 0
let contractsServicosIdContratoCol = 1
let contractsServicosCategoriaCol = 2
let contractsServicosTipoCol = 3
let contractsServicosCapacidadeCol = 4
let contractsServicosPeriodicidadeCol = 5
let contractServicosDataCadastroCol = 6
let contractsServicosDataExclusaoCol = 7
let contractsServicosDataAlteracaoCol = 8

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

// ===== tbl_contratos_Checklist =====
let contractsChecklistTableName = 'tbl_contratos_Checklist'
let firstLineContractsChecklist = 3
let numColumnsContractsChecklist = 6

let contractsChecklistIdCol = 0
let contractsChecklistIdContratoCol = 1
let contractsChecklistNomeCol = 2
let contractChecklistDataCadastroCol = 3
let contractsChecklistDataExclusaoCol = 4
let contractsChecklistDataAlteracaoCol = 5

function ReadContractsChecklist() {
  const objRows = ReadSheet(contractsChecklistTableName, firstLineContractsChecklist, numColumnsContractsChecklist)

  return objRows.map(linha =>
    linha.map(valor => (valor instanceof Date) ? dateToString(valor) : valor)
  )
}
