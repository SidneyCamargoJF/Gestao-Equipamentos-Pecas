function normalizarNomeFornecedor_(s) {
  return String(s || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

function buscarIndicadoresFornecedor() {
  const fornecedores = filtrarFornecedores({});
  const ativos = fornecedores.filter(f => !f.desativado);

  const tipos = {
    prestador: ativos.filter(f => f.prestadorServico && !f.distribuidorProdutos).length,
    distribuidor: ativos.filter(f => f.distribuidorProdutos && !f.prestadorServico).length,
    ambos: ativos.filter(f => f.prestadorServico && f.distribuidorProdutos).length,
    nenhum: ativos.filter(f => !f.prestadorServico && !f.distribuidorProdutos).length
  };

  const contagemPecas = {};
  ReadParts()
    .filter(l => !l[partsDtExclusaoCol])
    .forEach(l => {
      const chave = normalizarNomeFornecedor_(l[partsSuplierCol]);
      if (!chave) return;
      contagemPecas[chave] = (contagemPecas[chave] || 0) + 1;
    });

  const contagemContratos = {};
  ReadContracts()
    .filter(l => !l[contractDataExclusaoCol])
    .forEach(l => {
      const chave = normalizarNomeFornecedor_(l[contractEmpresaCol]);
      if (!chave) return;
      contagemContratos[chave] = (contagemContratos[chave] || 0) + 1;
    });

  const comVinculo = ativos.map(f => {
    const chaveRazao = normalizarNomeFornecedor_(f.razaoSocial);
    const chaveFantasia = normalizarNomeFornecedor_(f.nomeFantasia);
    const nPecas = contagemPecas[chaveRazao] || contagemPecas[chaveFantasia] || 0;
    const nContratos = contagemContratos[chaveRazao] || contagemContratos[chaveFantasia] || 0;
    return {
      id: f.id,
      nome: f.nomeFantasia || f.razaoSocial,
      pecas: nPecas,
      contratos: nContratos
    };
  });

  const topPecas = comVinculo.filter(f => f.pecas > 0).sort((a, b) => b.pecas - a.pecas).slice(0, 8);
  const semVinculo = comVinculo.filter(f => f.pecas === 0 && f.contratos === 0);

  return {
    totalAtivos: ativos.length,
    tipos: tipos,
    topPecas: topPecas,
    semVinculo: semVinculo
  };
}

// =====================================================
// DASHBOARD - Indicadores de Peças
// =====================================================

function paraRankingOrdenado_(mapaContagem) {
  return Object.keys(mapaContagem)
    .map(k => ({ label: k, valor: mapaContagem[k] }))
    .sort((a, b) => b.valor - a.valor);
}

function buscarIndicadoresPecas() {
  const hoje = new Date();
  const pecas = ReadParts().filter(l => !l[partsDtExclusaoCol]);

  let garantiaAtiva = 0, garantiaVencendo = 0, garantiaVencida = 0;
  let cadastradas30Dias = 0;
  const porMarca = {};
  const porLocalizacao = {};
  const vencendoLista = [];

  pecas.forEach(l => {
    const dtGarantiaRaw = l[partsDtGarantiaCol];
    const dtGarantia = dtGarantiaRaw instanceof Date ? dtGarantiaRaw : (dtGarantiaRaw ? stringToDate(String(dtGarantiaRaw)) : null);
    if (dtGarantia && !isNaN(dtGarantia)) {
      const dias = calculaDias(dtGarantia, new Date());
      const status = statusGarantia(dias);
      if (status === 'ativa') {
        garantiaAtiva++;
      } else if (status === 'vencendo') {
        garantiaVencendo++;
        vencendoLista.push({ id: l[partsIdCol], nome: String(l[partsNameCol] || ''), dias: dias });
      } else {
        garantiaVencida++;
      }
    }

    const dtCadastroRaw = l[partsDtCadastroCol];
    const dtCadastro = dtCadastroRaw instanceof Date ? dtCadastroRaw : (dtCadastroRaw ? stringToDate(String(dtCadastroRaw)) : null);
    if (dtCadastro && !isNaN(dtCadastro)) {
      const diasDesdeCadastro = Math.floor((hoje - dtCadastro) / (1000 * 60 * 60 * 24));
      if (diasDesdeCadastro >= 0 && diasDesdeCadastro <= 30) cadastradas30Dias++;
    }

    const marca = String(l[partsBrandCol] || '').trim();
    if (marca) porMarca[marca] = (porMarca[marca] || 0) + 1;

    const local = String(l[partsLocalCol] || '').trim();
    if (local) porLocalizacao[local] = (porLocalizacao[local] || 0) + 1;
  });

  return {
    totalAtivas: pecas.length,
    cadastradas30Dias: cadastradas30Dias,
    garantia: { ativa: garantiaAtiva, vencendo: garantiaVencendo, vencida: garantiaVencida },
    porMarca: paraRankingOrdenado_(porMarca).slice(0, 8),
    porLocalizacao: paraRankingOrdenado_(porLocalizacao).slice(0, 8),
    vencendoLista: vencendoLista.sort((a, b) => a.dias - b.dias).slice(0, 8)
  };
}

function buscarIndicadoresChamados() {
  const ativos = ReadTickets().filter(l => String(l[11] || '').trim().toLowerCase() !== 'cancelado');

  let abertos = 0, andamento = 0, concluidos = 0;
  const porPrioridade = {};
  const porTipo = {};

  ativos.forEach(l => {
    const status = String(l[11] || '').trim().toLowerCase();
    if (status === 'aberto') abertos++;
    else if (status === 'em andamento') andamento++;
    else if (status === 'concluido') concluidos++;

    if (status === 'aberto') {
    // Sempre conta, mesmo sem prioridade/tipo preenchido -- cair fora do
    // ranking nesse caso fazia a soma do gráfico não bater com o card de
    // "Abertos" (chamado contava ali, mas desaparecia do gráfico).
    const prioridade = String(l[4] || '').trim().toLowerCase() || 'indefinida';
    porPrioridade[prioridade] = (porPrioridade[prioridade] || 0) + 1;

    const tipo = String(l[3] || '').trim().toLowerCase() || 'indefinido';
    porTipo[tipo] = (porTipo[tipo] || 0) + 1;
    }
  });

  return {
    abertos: abertos,
    andamento: andamento,
    concluidos: concluidos,
    porPrioridade: paraRankingOrdenado_(porPrioridade),
    porTipo: paraRankingOrdenado_(porTipo)
  };
}

function buscarIndicadoresEquipamentos() {
  const model = new EquipmentsModel();
  const linhas = ReadSheet('tbl_equipamentos', 3, 12).filter(l => !l[model.colDtExclusao]);

  const porMarca = {};
  const porLocalizacao = {};

  linhas.forEach(l => {
    const marca = String(l[model.colMarca] || '').trim();
    if (marca) porMarca[marca] = (porMarca[marca] || 0) + 1;

    const local = String(l[model.colLocalizacao] || '').trim();
    if (local) porLocalizacao[local] = (porLocalizacao[local] || 0) + 1;
  });

  // Equipamentos com pelo menos 1 chamado em aberto ou em andamento (não
  // conta concluído/cancelado) -- usa o mesmo índice de equipamentoId (1)
  // que buscarIndicadoresChamados()/filtrarChamados() já usam.
  const idsComChamadoAberto = new Set(
    ReadTickets()
      .filter(t => {
        const status = String(t[11] || '').trim().toLowerCase();
        return status === 'aberto' || status === 'em andamento';
      })
      .map(t => Number(t[1]))
  );
  const comChamadoAberto = linhas.filter(l => idsComChamadoAberto.has(Number(l[model.colId]))).length;

  return {
    totalAtivos: linhas.length,
    comChamadoAberto: comChamadoAberto,
    porMarca: paraRankingOrdenado_(porMarca).slice(0, 8),
    porLocalizacao: paraRankingOrdenado_(porLocalizacao).slice(0, 8)
  };
}

// =====================================================
// DASHBOARD - Indicadores de Contratos
// Mesma lógica de "situação" (ativo/vencendo/vencido/encerrado) já usada em
// ConsultaContratoBackend.js -- reaproveitada aqui pra bater com o que a
// Consulta de Contratos mostra, em vez de confiar na coluna Situação
// gravada na planilha (que pode estar desatualizada).
// =====================================================

function buscarIndicadoresContratos() {
  const hoje = new Date();
  const ativos = ReadContracts().filter(l => String(l[contractActiveCol] || '').trim().toUpperCase() === 'Y');

  let qtdAtivo = 0, qtdVencendo = 0, qtdVencido = 0, qtdEncerrado = 0;
  let valorTotalVigentes = 0;
  const vencendoLista = [];

  ativos.forEach(l => {
    let situacao = 'ativo';
    let dtFinal = null;

    if (l[contractDataEncerramento]) {
      situacao = 'encerrado';
    } else {
      const dtFinalRaw = l[contractDataFinalCol];
      dtFinal = dtFinalRaw instanceof Date ? dtFinalRaw : (dtFinalRaw ? stringToDate(String(dtFinalRaw)) : null);
      if (dtFinal && !isNaN(dtFinal)) {
        const diasParaVencer = Math.floor((dtFinal - hoje) / (1000 * 60 * 60 * 24));
        if (diasParaVencer < 0) situacao = 'vencido';
        else if (diasParaVencer <= 30) situacao = 'vencendo';
      }
    }

    const valor = Number(l[contractValorCol]) || 0;

    if (situacao === 'ativo') {
      qtdAtivo++;
      valorTotalVigentes += valor;
    } else if (situacao === 'vencendo') {
      qtdVencendo++;
      valorTotalVigentes += valor;
      const dias = Math.floor((dtFinal - hoje) / (1000 * 60 * 60 * 24));
      vencendoLista.push({ id: l[contractIdCol], numero: String(l[contractNumberCol] || ''), nome: String(l[contractNameCol] || ''), dias: dias });
    } else if (situacao === 'vencido') {
      qtdVencido++;
    } else {
      qtdEncerrado++;
    }
  });

  return {
    totalAtivos: ativos.length,
    situacao: { ativo: qtdAtivo, vencendo: qtdVencendo, vencido: qtdVencido, encerrado: qtdEncerrado },
    valorTotalVigentes: valorTotalVigentes,
    vencendoLista: vencendoLista.sort((a, b) => a.dias - b.dias).slice(0, 8)
  };
}

// =====================================================
// DASHBOARD - Manutenção do mês
// Preventivas da competência atual (situação + % de itens de checklist
// executados), corretivas com prazo de SLA vencido e ranking de
// equipamentos com mais corretivas nos últimos 12 meses.
// =====================================================
function buscarIndicadoresManutencao() {
  const agora = new Date();
  const tz = Session.getScriptTimeZone();
  const competencia = Utilities.formatDate(agora, tz, 'yyyy-MM');
  const chamados = ReadTickets().filter(l => String(l[ticketsStatusCol - 1] || '').trim().toLowerCase() !== 'cancelado');
  const tipo = l => String(l[ticketsTypeCol - 1] || '').trim().toLowerCase();
  const status = l => String(l[ticketsStatusCol - 1] || '').trim().toLowerCase();

  // Preventiva "do mês": competência atual; sem competência (manual), pela
  // data prevista ou, na falta dela, pela data de abertura.
  const mesDe = valor => { const d = parseDataFlex(valor); return d ? Utilities.formatDate(d, tz, 'yyyy-MM') : ''; };
  const preventivas = chamados.filter(l => {
    if (tipo(l) !== 'preventiva') return false;
    const comp = String(l[ticketsCompetenciaCol - 1] || '').trim();
    if (comp) return comp === competencia;
    return (mesDe(l[ticketsDataPrevistaCol - 1]) || mesDe(l[ticketsDtAberturaCol - 1])) === competencia;
  });

  const prev = { total: preventivas.length, concluidas: 0, andamento: 0, pendentes: 0, atrasadas: 0 };
  preventivas.forEach(l => {
    const s = status(l);
    if (s === 'concluido') prev.concluidas++;
    else if (s === 'em andamento') prev.andamento++;
    else prev.pendentes++;
    const prevista = parseDataFlex(l[ticketsDataPrevistaCol - 1]);
    if (s !== 'concluido' && prevista && inicioDoDia(prevista) < inicioDoDia(agora)) prev.atrasadas++;
  });

  const idsPreventivas = new Set(preventivas.map(l => Number(l[0])));
  const itens = ReadTicketChecklist().filter(l =>
    idsPreventivas.has(Number(l[ticketChecklistChamadoIdCol - 1])) && !l[ticketChecklistDataExclusaoCol - 1]);
  const executados = itens.filter(l => String(l[ticketChecklistResultadoCol - 1] || 'pendente').trim().toLowerCase() !== 'pendente').length;

  const corretivasForaPrazo = chamados
    .filter(l => tipo(l) === 'corretiva')
    .map(l => ({ l: l, atraso: avaliarAtrasoChamado(l, agora) }))
    .filter(x => x.atraso.prazoVencido)
    .map(x => ({
      id: x.l[0],
      motivo: String(x.l[ticketsReasonCol - 1] || ''),
      atribuidoA: String(x.l[ticketsAtribuidoCol - 1] || ''),
      situacao: x.atraso.motivos.filter(m => m.indexOf('prazo') === 0).join(', ')
    }))
    .sort((a, b) => Number(a.id) - Number(b.id));

  // Ranking: corretivas abertas nos últimos 12 meses, por equipamento.
  const limite = new Date(agora.getFullYear() - 1, agora.getMonth(), agora.getDate());
  const porEquip = {};
  chamados.forEach(l => {
    if (tipo(l) !== 'corretiva' || !l[ticketsEquipamentoIdCol - 1]) return;
    const abertura = parseDataFlex(l[ticketsDtAberturaCol - 1]);
    if (!abertura || abertura < limite) return;
    const id = Number(l[ticketsEquipamentoIdCol - 1]);
    porEquip[id] = (porEquip[id] || 0) + 1;
  });
  const equipamentos = {};
  ReadEquipments().forEach(e => { equipamentos[Number(e[0])] = e; });
  const rankingEquipamentos = Object.keys(porEquip)
    .map(id => {
      const e = equipamentos[Number(id)];
      const label = e ? ((e[5] ? e[5] + ' - ' : '') + e[1] + (e[7] ? ' (' + e[7] + ')' : '')) : ('Equipamento #' + id);
      return { label: label, patrimonio: e ? String(e[5] || '') : '', valor: porEquip[id] };
    })
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 8);

  return {
    competencia: competencia,
    preventivas: prev,
    itens: { total: itens.length, executados: executados, percentual: itens.length ? Math.round(executados * 100 / itens.length) : 0 },
    corretivasForaPrazo: corretivasForaPrazo.length,
    corretivasForaPrazoLista: corretivasForaPrazo.slice(0, 8),
    rankingEquipamentos: rankingEquipamentos
  };
}
