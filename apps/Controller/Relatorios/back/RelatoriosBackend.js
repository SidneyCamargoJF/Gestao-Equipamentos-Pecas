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
        const bruto = String(linha[contractsChecklistNomeCol] || '');
        const match = bruto.match(/^\[(Mensal|Anual)\]\s*(.*)$/);
        return match
            ? { descricao: match[2], periodo: match[1].toLowerCase() }
            : { descricao: bruto, periodo: 'mensal' };
    });

    return { servico: servicos[0] || null, checklist: checklist };
}