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

// =====================================================
// RELATÓRIO DE MEDIÇÃO DAS PREVENTIVAS
// Para conferir a nota fiscal da empresa: quantos equipamentos tiveram a
// preventiva EFETIVAMENTE feita na competência, agrupados pelo serviço do
// contrato (categoria + tipo + capacidade), com valor unitário e total.
//
// Equipamento "feito" = está numa OS preventiva do contrato naquela
// competência (não cancelada/excluída) e tem pelo menos um item de
// checklist com resultado "ok" ou "nao_conforme". Itens só "pendente" ou
// "nao_aplicavel" não contam.
// O valor unitário vem de tbl_contratos_servicos (coluna K) do serviço
// Preventiva com mesma categoria/tipo/capacidade do equipamento
// (equipamento: NOME / MODELO / CAPACIDADE -- mesma regra da aba Serviços).
// =====================================================
const RESULTADOS_EXECUTADOS_MEDICAO = ['ok', 'nao_conforme'];

function chaveEspecificacaoMedicao_(categoria, tipo, capacidade) {
  const n = function (v) { return String(v || '').trim().toLowerCase(); };
  return n(categoria) + '|' + n(tipo) + '|' + n(capacidade);
}

function buscarRelatorioMedicaoPreventiva(contratoId, competencia) {
  try {
    const idContrato = Number(contratoId);
    if (!idContrato) return { sucesso: false, mensagem: 'Selecione um contrato.' };
    const comp = String(competencia || '').trim();
    if (!parseCompetencia_(comp)) return { sucesso: false, mensagem: 'Competência inválida (use AAAA-MM).' };

    const contrato = ReadContracts().find(function (l) { return Number(l[contractIdCol]) === idContrato; });
    if (!contrato) return { sucesso: false, mensagem: 'Contrato não encontrado.' };

    // OS preventivas do contrato na competência
    const os = ReadTickets().filter(function (l) {
      return Number(l[ticketsContratoIdCol - 1]) === idContrato &&
        String(l[ticketsTypeCol - 1] || '').trim().toLowerCase() === 'preventiva' &&
        String(l[ticketsCompetenciaCol - 1] || '').trim() === comp &&
        String(l[ticketsStatusCol - 1] || '').trim().toLowerCase() !== 'cancelado' &&
        !l[ticketsDtExclusaoCol - 1];
    });
    const idsOS = os.map(function (l) { return Number(l[ticketsIdCol - 1]); });
    const setOS = new Set(idsOS);

    // situação de cada equipamento nas OS
    const porEquip = {};
    ReadTicketChecklist().forEach(function (l) {
      if (!setOS.has(Number(l[ticketChecklistChamadoIdCol - 1])) || l[ticketChecklistDataExclusaoCol - 1]) return;
      const idEquip = Number(l[ticketChecklistEquipamentoIdCol - 1]);
      if (!idEquip) return;
      const r = String(l[ticketChecklistResultadoCol - 1] || 'pendente').trim().toLowerCase();
      const e = porEquip[idEquip] || (porEquip[idEquip] = { executados: 0, pendentes: 0, total: 0 });
      e.total++;
      if (RESULTADOS_EXECUTADOS_MEDICAO.indexOf(r) !== -1) e.executados++;
      else if (r === 'pendente') e.pendentes++;
    });

    const equipamentos = {};
    ReadEquipments().forEach(function (e) { equipamentos[Number(e[0])] = e; });

    // serviços preventivos do contrato, por especificação
    const servicos = {};
    ReadContractsServicos().forEach(function (l) {
      if (Number(l[contractsServicosIdContratoCol]) !== idContrato || l[contractsServicosDataExclusaoCol]) return;
      if (String(l[contractsServicosTipoManutencaoCol] || '').trim().toLowerCase() !== 'preventiva') return;
      const chave = chaveEspecificacaoMedicao_(l[contractsServicosCategoriaCol], l[contractsServicosTipoCol], l[contractsServicosCapacidadeCol]);
      if (!servicos[chave]) {
        servicos[chave] = {
          categoria: String(l[contractsServicosCategoriaCol] || '').trim(),
          tipo: String(l[contractsServicosTipoCol] || '').trim(),
          capacidade: String(l[contractsServicosCapacidadeCol] || '').trim(),
          valorUnitario: lerValorUnitarioServico(l)
        };
      }
    });

    const grupos = {};
    const naoExecutados = [];
    Object.keys(porEquip).forEach(function (id) {
      const situacao = porEquip[id];
      const e = equipamentos[Number(id)];
      const info = {
        id: Number(id),
        patrimonio: e ? String(e[5] || '') : '',
        nome: e ? String(e[1] || '') : 'Equipamento #' + id,
        localizacao: e ? String(e[7] || '') : ''
      };
      if (!situacao.executados) {
        naoExecutados.push(Object.assign(info, { pendentes: situacao.pendentes, itens: situacao.total }));
        return;
      }
      const categoria = e ? String(e[1] || '').trim() : '';
      const tipo = e ? String(e[4] || '').trim() : '';
      const capacidade = e ? String(e[3] || '').trim() : '';
      const chave = chaveEspecificacaoMedicao_(categoria, tipo, capacidade);
      const servico = servicos[chave];
      const g = grupos[chave] || (grupos[chave] = {
        categoria: servico ? servico.categoria : categoria,
        tipo: servico ? servico.tipo : tipo,
        capacidade: servico ? servico.capacidade : capacidade,
        valorUnitario: servico ? servico.valorUnitario : '',
        semServico: !servico,
        quantidade: 0,
        equipamentos: []
      });
      g.quantidade++;
      g.equipamentos.push(info);
    });

    const numCap = function (v) { const n = Number(String(v).replace(/\D/g, '')); return isNaN(n) ? 0 : n; };
    const lista = Object.keys(grupos).map(function (k) {
      const g = grupos[k];
      g.valorTotal = g.valorUnitario === '' ? '' : Math.round(g.valorUnitario * g.quantidade * 100) / 100;
      g.equipamentos.sort(function (a, b) { return a.patrimonio.localeCompare(b.patrimonio); });
      return g;
    }).sort(function (a, b) {
      return a.categoria.localeCompare(b.categoria) || a.tipo.localeCompare(b.tipo) || numCap(a.capacidade) - numCap(b.capacidade);
    });

    const total = lista.reduce(function (acc, g) {
      acc.quantidade += g.quantidade;
      if (g.valorTotal !== '') acc.valor = Math.round((acc.valor + g.valorTotal) * 100) / 100;
      else acc.gruposSemValor++;
      return acc;
    }, { quantidade: 0, valor: 0, gruposSemValor: 0 });

    return {
      sucesso: true,
      contrato: {
        id: idContrato,
        numero: String(contrato[contractNumberCol] || ''),
        nome: String(contrato[contractNameCol] || ''),
        empresa: String(contrato[contractEmpresaCol] || '')
      },
      competencia: comp,
      os: idsOS,
      grupos: lista,
      total: total,
      naoExecutados: naoExecutados.sort(function (a, b) { return a.patrimonio.localeCompare(b.patrimonio); }),
      mensagem: idsOS.length ? '' : 'Nenhuma OS preventiva deste contrato na competência ' + comp + '.'
    };
  } catch (e) {
    return { sucesso: false, mensagem: 'Erro no servidor: ' + e.message };
  }
}
