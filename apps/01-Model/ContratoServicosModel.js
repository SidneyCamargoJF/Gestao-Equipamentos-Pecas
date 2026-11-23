// =====================================================
// MODEL - tbl_contratos_servicos
// Serviços especificados no contrato (tipo de manutenção + categoria/tipo/capacidade).
// Constantes 0-based (índice direto no array do Read*(); use col + 1
// em getRange).
// =====================================================

let contractsServicosTableName = 'tbl_contratos_servicos'
let firstLineContractsServicos = 3
let numColumnsContractsServicos = 11

let contractsServicosIdCol = 0
let contractsServicosIdContratoCol = 1
let contractsServicosTipoManutencaoCol = 2
let contractsServicosCategoriaCol = 3
let contractsServicosTipoCol = 4
let contractsServicosCapacidadeCol = 5
let contractsServicosPeriodicidadeCol = 6
let contractServicosDataCadastroCol = 7
let contractsServicosDataExclusaoCol = 8
let contractsServicosDataAlteracaoCol = 9
let contractsServicosValorUnitarioCol = 10   // K -- valor unitário (R$) por equipamento atendido

function ReadContractsServicos() {
  const objRows = ReadSheet(contractsServicosTableName, firstLineContractsServicos, numColumnsContractsServicos)

  return objRows.map(linha =>
    linha.map(valor => (valor instanceof Date) ? dateToString(valor) : valor)
  )
}

// Valor unitário do serviço como número (aceita número da planilha ou
// texto "1.234,56"); '' quando não informado.
function lerValorUnitarioServico(linha) {
  const bruto = linha[contractsServicosValorUnitarioCol]
  if (bruto === '' || bruto === null || bruto === undefined) return ''
  if (typeof bruto === 'number') return bruto
  const n = parseFloat(String(bruto).replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.'))
  return isNaN(n) ? '' : n
}
