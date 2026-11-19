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

function buscarRelatorioChecklist(contratoId) {
    const idBuscado = Number(contratoId);

    const servicos = ReadContractsServicos()
        .filter(linha => Number(linha[contractsServicosIdContratoCol]) === idBuscado && !linha[contractsServicosDataExclusaoCol])
        .map(linha => ({
        tipoManutencao: linha[contractsServicosTipoManutencaoCol] || '',
        categoria: linha[contractsServicosCategoriaCol] || '',
        tipo: linha[contractsServicosTipoCol] || '',
        capacidade: linha[contractsServicosCapacidadeCol] || '',
        periodicidade: linha[contractsServicosPeriodicidadeCol] || ''
    }));

    const checklist = ReadContractsChecklist()
    .filter(linha => Number(linha[contractsChecklistIdContratoCol]) === idBuscado && !linha[contractsChecklistDataExclusaoCol])
    .map(linha => {
        const item = lerItemChecklistContrato(linha);
        return { descricao: item.descricao, periodo: item.periodo };
    });

    return { servico: servicos[0] || null, checklist: checklist, periodicidades: PERIODICIDADES_ORDEM };
}