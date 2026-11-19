// =====================================================
// MODEL - tbl_contratos_sla
// Prazos de atendimento/solução por prioridade de chamado, por contrato.
// Constantes 0-based (índice direto no array de ReadContractsSla();
// use col + 1 em getRange).
// =====================================================

// Um registro por prioridade do chamado (baixa/media/alta/urgente) por contrato.
let contractsSlaTableName = 'tbl_contratos_sla'
let firstLineContractsSla = 3
let numColumnsContractsSla = 9

let contractsSlaIdCol = 0
let contractsSlaIdContratoCol = 1
let contractsSlaPrioridadeCol = 2
let contractsSlaPrazoAtendimentoCol = 3   // horas
let contractsSlaPrazoSolucaoCol = 4       // horas
let contractsSlaHorasUteisCol = 5         // 'Y' | 'N'
let contractsSlaDataCadastroCol = 6
let contractsSlaDataAlteracaoCol = 7
let contractsSlaDataExclusaoCol = 8

const PRIORIDADES_CHAMADO = ['baixa', 'media', 'alta', 'urgente']

function ReadContractsSla() {
  const objRows = ReadSheetSeExistir(contractsSlaTableName, firstLineContractsSla, numColumnsContractsSla)

  return objRows.map(linha =>
    linha.map(valor => (valor instanceof Date) ? dateToString(valor) : valor)
  )
}
