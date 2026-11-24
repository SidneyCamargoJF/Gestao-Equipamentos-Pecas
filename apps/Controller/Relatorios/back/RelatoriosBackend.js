// =====================================================
// RELATÓRIOS -- parte comum (lista de contratos dos filtros).
// Cada relatório tem o próprio arquivo:
//   RelatorioChecklistBackend.js  -> buscarRelatorioChecklist
//   RelatorioManutencaoBackend.js -> buscarRelatorioManutencaoPreventiva
// =====================================================

function fillContracts() {
const contratos = ReadContracts()

return contratos
.filter(linha => linha[contractIdCol] && !linha[contractDataExclusaoCol])
.map(linha => ({
    id: linha[contractIdCol],
    numero: linha[contractNumberCol],
    nome: linha[contractNameCol]
}))
}
