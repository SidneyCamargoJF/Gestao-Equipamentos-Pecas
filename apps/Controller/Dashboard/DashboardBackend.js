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
    const prioridade = String(l[4] || '').trim().toLowerCase();
    if (prioridade) porPrioridade[prioridade] = (porPrioridade[prioridade] || 0) + 1;

    const tipo = String(l[3] || '').trim().toLowerCase();
    if (tipo) porTipo[tipo] = (porTipo[tipo] || 0) + 1;
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
