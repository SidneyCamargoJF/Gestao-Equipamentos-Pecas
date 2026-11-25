// =====================================================
// RELATÓRIO DE MANUTENÇÃO DAS PREVENTIVAS
// Para conferir a nota fiscal da empresa: quantos equipamentos tiveram a
// preventiva feita, agrupados pelo serviço do contrato (categoria + tipo +
// capacidade), com valor unitário e total.
//
// Filtro: contrato, competência ou os dois (pelo menos um). O resultado
// sai em seções, uma por contrato + competência (cada uma corresponde a
// uma medição/NF), e um total geral no fim.
//
// OS consideradas: chamados preventivos (não cancelados/excluídos).
// Equipamentos da OS: os do checklist mais os da lista do chamado
// (tbl_chamado_equipamentos; sem lista, a coluna B).
// Equipamento "feito":
//   - tem pelo menos um item de checklist "ok" ou "nao_conforme"; ou
//   - a OS está Concluída, a não ser que todos os itens dele estejam
//     "nao_aplicavel" (marcado como não se aplica). Isso cobre a OS
//     fechada sem marcar o checklist e a preventiva manual sem checklist.
// O valor unitário vem de tbl_contratos_servicos (coluna K) do serviço
// Preventiva com mesma categoria/tipo/capacidade do equipamento
// (equipamento: NOME / MODELO / CAPACIDADE -- mesma regra da aba Serviços).
// =====================================================
const RESULTADOS_EXECUTADOS_MANUTENCAO = ['ok', 'nao_conforme'];

function chaveEspecificacaoManutencao_(categoria, tipo, capacidade) {
  const n = function (v) { return String(v || '').trim().toLowerCase(); };
  return n(categoria) + '|' + n(tipo) + '|' + n(capacidade);
}

// Competência da OS. Preventiva manual pode não ter: usa o mês da
// finalização (ou, se ainda aberta, da abertura).
function competenciaOsManutencao_(l) {
  const comp = String(l[ticketsCompetenciaCol - 1] || '').trim();
  if (comp) return comp;
  const mesDe = function (v) {
    if (v instanceof Date && !isNaN(v)) return Utilities.formatDate(v, 'America/Sao_Paulo', 'yyyy-MM');
    const m =String(v || '').match(/^\s*\d{1,2}\/(\d{1,2})\/(\d{4})/);
    return m ? m[2] + '-' + ('0' + m[1]).slice(-2) : '';
  };
  return mesDe(l[ticketsDtFinalizacaoCol - 1]) || mesDe(l[ticketsDtAberturaCol - 1]);
}

function buscarRelatorioManutencaoPreventiva(contratoId, competencia) {
  try {
    const idContrato = Number(contratoId) || 0;
    const comp = String(competencia || '').trim();
    if (!idContrato && !comp) return { sucesso: false, mensagem: 'Escolha o contrato, a competência ou os dois.' };
    if (comp && !parseCompetencia_(comp)) return { sucesso: false, mensagem: 'Competência inválida (use AAAA-MM).' };

    const contratos = {};
    ReadContracts().forEach(function (l) { contratos[Number(l[contractIdCol])] = l; });
    if (idContrato && !contratos[idContrato]) return { sucesso: false, mensagem: 'Contrato não encontrado.' };

    // OS preventivas do filtro
    const os = ReadTickets().filter(function (l) {
      return String(l[ticketsTypeCol - 1] || '').trim().toLowerCase() === 'preventiva' &&
        (!idContrato || Number(l[ticketsContratoIdCol - 1]) === idContrato) &&
        (!comp || competenciaOsManutencao_(l) === comp) &&
        String(l[ticketsStatusCol - 1] || '').trim().toLowerCase() !== 'cancelado' &&
        !l[ticketsDtExclusaoCol - 1];
    });

    // itens de checklist por OS e equipamento
    const setOS = new Set(os.map(function (l) { return Number(l[ticketsIdCol - 1]); }));
    const itensPorOs = {};
    ReadTicketChecklist().forEach(function (l) {
      const idOs = Number(l[ticketChecklistChamadoIdCol - 1]);
      if (!setOS.has(idOs) || l[ticketChecklistDataExclusaoCol - 1]) return;
      const idEquip = Number(l[ticketChecklistEquipamentoIdCol - 1]);
      if (!idEquip) return;
      const r = String(l[ticketChecklistResultadoCol - 1] || 'pendente').trim().toLowerCase();
      const porEquip = itensPorOs[idOs] || (itensPorOs[idOs] = {});
      const s = porEquip[idEquip] || (porEquip[idEquip] = { executados: 0, pendentes: 0, naoAplicaveis: 0, total: 0, observacoes: [] });
      s.total++;
      const obsItem = String(l[ticketChecklistObservacaoCol - 1] || '').trim();
      if (obsItem) {
        s.observacoes.push({ os: idOs, origem: String(l[ticketChecklistDescricaoCol - 1] || 'Item do checklist').trim(), texto: obsItem });
      }
      if (RESULTADOS_EXECUTADOS_MANUTENCAO.indexOf(r) !== -1) s.executados++;
      else if (r === 'nao_aplicavel') s.naoAplicaveis++;
      else s.pendentes++;
    });
    const linhasEquipChamado = ReadTicketEquipamentos();

    // observação de encerramento por equipamento (tbl_chamado_equipamentos, col. F)
    const obsEncerramento = {};
    linhasEquipChamado.forEach(function (l) {
      const idOs = Number(l[ticketEquipChamadoIdCol - 1]);
      if (!setOS.has(idOs) || l[ticketEquipDataExclusaoCol - 1]) return;
      const texto = String(l[ticketEquipObservacaoCol - 1] || '').trim();
      if (!texto) return;
      (obsEncerramento[idOs] || (obsEncerramento[idOs] = {}))[Number(l[ticketEquipEquipamentoIdCol - 1])] = texto;
    });

    // observação da resolução: o motivo informado ao concluir, gravado no
    // histórico ('[SISTEMA] Chamado encerrado[ com N item(ns)...]. Motivo: X').
    // Vale a última de cada OS (reaberta e concluída de novo = a mais recente).
    const resolucaoPorOs = {};
    ReadTicketHistorico().forEach(function (l) {
      const idOs = Number(l[ticketHistoricoChamadoIdCol - 1]);
      if (!setOS.has(idOs)) return;
      const m = String(l[ticketHistoricoTextoCol - 1] || '').match(/Chamado encerrado[^\n]*?\. Motivo: ([\s\S]*)$/);
      if (m && m[1].trim()) resolucaoPorOs[idOs] = m[1].trim();
    });

    const equipamentos = {};
    ReadEquipments().forEach(function (e) { equipamentos[Number(e[0])] = e; });

    // serviços preventivos por contrato e especificação
    const servicosPorContrato = {};
    ReadContractsServicos().forEach(function (l) {
      const idC = Number(l[contractsServicosIdContratoCol]);
      if (l[contractsServicosDataExclusaoCol]) return;
      if (String(l[contractsServicosTipoManutencaoCol] || '').trim().toLowerCase() !== 'preventiva') return;
      const servicos = servicosPorContrato[idC] || (servicosPorContrato[idC] = {});
      const chave = chaveEspecificacaoManutencao_(l[contractsServicosCategoriaCol], l[contractsServicosTipoCol], l[contractsServicosCapacidadeCol]);
      if (!servicos[chave]) {
        servicos[chave] = {
          categoria: String(l[contractsServicosCategoriaCol] || '').trim(),
          tipo: String(l[contractsServicosTipoCol] || '').trim(),
          capacidade: String(l[contractsServicosCapacidadeCol] || '').trim(),
          valorUnitario: lerValorUnitarioServico(l)
        };
      }
    });

    // seções: contrato + competência. Em cada seção o equipamento conta uma
    // vez; se está em mais de uma OS, vale a melhor situação.
    const secoes = {};
    os.forEach(function (l) {
      const idOs = Number(l[ticketsIdCol - 1]);
      const idC = Number(l[ticketsContratoIdCol - 1]) || 0;
      const compOs = competenciaOsManutencao_(l);
      const status = String(l[ticketsStatusCol - 1] || '').trim();
      const concluida = status.toLowerCase() === 'concluido';
      const chaveSecao = idC + '|' + compOs;
      const secao = secoes[chaveSecao] || (secoes[chaveSecao] = { idContrato: idC, competencia: compOs, os: [], equip: {}, obs: {} });
      secao.os.push({ id: idOs, status: status, resolucao: concluida ? (resolucaoPorOs[idOs] || '') : '' });

      const itens = itensPorOs[idOs] || {};
      const ids = idsEquipamentosDoChamado_(idOs, l[ticketsEquipamentoIdCol - 1], linhasEquipChamado);
      Object.keys(itens).forEach(function (k) { if (ids.indexOf(Number(k)) === -1) ids.push(Number(k)); });

      ids.forEach(function (idEquip) {
        const s = itens[idEquip] || { executados: 0, pendentes: 0, naoAplicaveis: 0, total: 0, observacoes: [] };

        // observações do equipamento nesta OS: a do encerramento e as dos itens
        const obsEquip = secao.obs[idEquip] || (secao.obs[idEquip] = []);
        const textoEnc = (obsEncerramento[idOs] || {})[idEquip];
        if (textoEnc) obsEquip.push({ os: idOs, origem: 'Encerramento', texto: textoEnc });
        s.observacoes.forEach(function (o) { obsEquip.push(o); });

        let executado = false, motivo = '';
        if (s.executados) executado = true;
        else if (s.total && s.naoAplicaveis === s.total) motivo = 'Itens do checklist marcados como N/A';
        else if (concluida) executado = true;
        else motivo = s.total ? (s.pendentes + ' de ' + s.total + ' itens pendentes; chamado ' + (status || 'Aberto')) : 'Chamado ' + (status || 'Aberto');

        const atual = secao.equip[idEquip];
        if (!atual || (executado && !atual.executado)) {
          secao.equip[idEquip] = { executado: executado, motivo: motivo, os: idOs };
        }
      });
    });

    const numCap = function (v) { const n = Number(String(v).replace(/\D/g, '')); return isNaN(n) ? 0 : n; };
    const lista = Object.keys(secoes).map(function (k) {
      const secao = secoes[k];
      const c = contratos[secao.idContrato];
      const servicos = servicosPorContrato[secao.idContrato] || {};
      const grupos = {};
      const naoExecutados = [];

      Object.keys(secao.equip).forEach(function (id) {
        const situacao = secao.equip[id];
        const e = equipamentos[Number(id)];
        const info = {
          id: Number(id),
          patrimonio: e ? String(e[5] || '') : '',
          nome: e ? String(e[1] || '') : 'Equipamento #' + id,
          localizacao: e ? String(e[7] || '') : '',
          os: situacao.os
        };
        if (!situacao.executado) {
          naoExecutados.push(Object.assign(info, { motivo: situacao.motivo }));
          return;
        }
        const categoria = e ? String(e[1] || '').trim() : '';
        const tipo = e ? String(e[4] || '').trim() : '';
        const capacidade = e ? String(e[3] || '').trim() : '';
        const chave = chaveEspecificacaoManutencao_(categoria, tipo, capacidade);
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

      const listaGrupos = Object.keys(grupos).map(function (chave) {
        const g = grupos[chave];
        g.valorTotal = g.valorUnitario === '' ? '' : Math.round(g.valorUnitario * g.quantidade * 100) / 100;
        g.equipamentos.sort(function (a, b) { return a.patrimonio.localeCompare(b.patrimonio); });
        return g;
      }).sort(function (a, b) {
        return a.categoria.localeCompare(b.categoria) || a.tipo.localeCompare(b.tipo) || numCap(a.capacidade) - numCap(b.capacidade);
      });

      const total = listaGrupos.reduce(function (acc, g) {
        acc.quantidade += g.quantidade;
        if (g.valorTotal !== '') acc.valor = Math.round((acc.valor + g.valorTotal) * 100) / 100;
        else acc.gruposSemValor++;
        return acc;
      }, { quantidade: 0, valor: 0, gruposSemValor: 0 });

      // equipamentos com observação no chamado (encerramento e itens do checklist)
      const observacoes = Object.keys(secao.obs).filter(function (id) { return secao.obs[id].length; }).map(function (id) {
        const e = equipamentos[Number(id)];
        const situacao = secao.equip[id] || {};
        return {
          id: Number(id),
          patrimonio: e ? String(e[5] || '') : '',
          nome: e ? String(e[1] || '') + (e[4] ? ' / ' + String(e[4]) : '') : 'Equipamento #' + id,
          localizacao: e ? String(e[7] || '') : '',
          executado: !!situacao.executado,
          itens: secao.obs[id]
        };
      }).sort(function (a, b) { return a.patrimonio.localeCompare(b.patrimonio, 'pt-BR', { numeric: true }); });

      return {
        observacoes: observacoes,
        contrato: c ? {
          id: secao.idContrato,
          numero: String(c[contractNumberCol] || ''),
          nome: String(c[contractNameCol] || ''),
          empresa: String(c[contractEmpresaCol] || '')
        } : { id: secao.idContrato, numero: '', nome: secao.idContrato ? 'Contrato #' + secao.idContrato : 'Sem contrato vinculado', empresa: '' },
        competencia: secao.competencia,
        os: secao.os.sort(function (a, b) { return a.id - b.id; }),
        grupos: listaGrupos,
        total: total,
        naoExecutados: naoExecutados.sort(function (a, b) { return a.patrimonio.localeCompare(b.patrimonio); })
      };
    }).sort(function (a, b) {
      return (a.contrato.numero || '~').localeCompare(b.contrato.numero || '~', 'pt-BR', { numeric: true }) ||
        a.competencia.localeCompare(b.competencia);
    });

    const totalGeral = lista.reduce(function (acc, s) {
      acc.quantidade += s.total.quantidade;
      acc.valor = Math.round((acc.valor + s.total.valor) * 100) / 100;
      acc.gruposSemValor += s.total.gruposSemValor;
      return acc;
    }, { quantidade: 0, valor: 0, gruposSemValor: 0 });

    const c = idContrato ? contratos[idContrato] : null;
    return {
      sucesso: true,
      filtro: {
        contrato: c ? String(c[contractNumberCol] || '') + ' — ' + String(c[contractNameCol] || '') : '',
        competencia: comp
      },
      secoes: lista,
      totalGeral: totalGeral,
      mensagem: lista.length ? '' : 'Nenhum chamado preventivo encontrado para o filtro escolhido.'
    };
  } catch (e) {
    return { sucesso: false, mensagem: 'Erro no servidor: ' + e.message };
  }
}
