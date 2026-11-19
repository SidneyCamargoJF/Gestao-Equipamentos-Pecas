// =====================================================
// EXECUÇÃO DO CHECKLIST NA OS (tbl_chamado_checklist)
// Usado pela aba "Checklist" do modal de detalhes do chamado.
// =====================================================

const ROTULOS_RESULTADO_CHECKLIST = {
  pendente: 'Pendente', ok: 'OK', nao_conforme: 'Não conforme', nao_aplicavel: 'N/A'
};

function itensChecklistDoChamado_(chamadoId, linhas) {
  const id = Number(chamadoId);
  return (linhas || ReadTicketChecklist()).filter(function (l) {
    return Number(l[ticketChecklistChamadoIdCol - 1]) === id && !l[ticketChecklistDataExclusaoCol - 1];
  });
}

function resumoChecklist_(linhas) {
  const r = { total: linhas.length, ok: 0, nao_conforme: 0, pendente: 0, nao_aplicavel: 0 };
  linhas.forEach(function (l) {
    const res = String(l[ticketChecklistResultadoCol - 1] || 'pendente').trim().toLowerCase();
    r[r.hasOwnProperty(res) ? res : 'pendente']++;
  });
  return r;
}

/** Quantos itens do checklist do chamado ainda estão pendentes (0 se não tem checklist). */
function contarPendentesChecklistChamado(chamadoId) {
  return resumoChecklist_(itensChecklistDoChamado_(chamadoId)).pendente;
}

/**
 * Itens do checklist do chamado agrupados por equipamento
 * (patrimônio + localização). grupos vazio = chamado sem checklist.
 */
function buscarChecklistChamado(chamadoId) {
  try {
    const linhas = itensChecklistDoChamado_(chamadoId);
    if (!linhas.length) return { sucesso: true, grupos: [], resumo: resumoChecklist_([]) };

    const equipamentos = {};
    ReadEquipments().forEach(function (e) { equipamentos[Number(e[0])] = e; });

    const grupos = [];
    const porEquip = {};
    linhas.forEach(function (l) {
      const idEquip = Number(l[ticketChecklistEquipamentoIdCol - 1]) || 0;
      if (!porEquip[idEquip]) {
        const e = equipamentos[idEquip] || [];
        porEquip[idEquip] = {
          equipamentoId: idEquip,
          patrimonio: e[5] || '',
          nome: [e[1], e[4]].filter(Boolean).join('/'),
          localizacao: e[7] || '',
          itens: []
        };
        grupos.push(porEquip[idEquip]);
      }
      porEquip[idEquip].itens.push({
        id: l[ticketChecklistIdCol - 1],
        descricao: String(l[ticketChecklistDescricaoCol - 1] || ''),
        periodicidade: String(l[ticketChecklistPeriodicidadeCol - 1] || ''),
        resultado: String(l[ticketChecklistResultadoCol - 1] || 'pendente').trim().toLowerCase(),
        observacao: String(l[ticketChecklistObservacaoCol - 1] || ''),
        executadoEm: String(l[ticketChecklistExecutadoEmCol - 1] || ''),
        registradoPor: String(l[ticketChecklistRegistradoPorCol - 1] || '')
      });
    });

    grupos.sort(function (a, b) {
      return String(a.localizacao).localeCompare(String(b.localizacao)) || String(a.patrimonio).localeCompare(String(b.patrimonio));
    });
    return { sucesso: true, grupos: grupos, resumo: resumoChecklist_(linhas) };
  } catch (e) {
    return { sucesso: false, mensagem: 'Erro no servidor: ' + e.message };
  }
}

/**
 * Grava RESULTADO/OBSERVACAO dos itens informados (só os que mudaram),
 * com EXECUTADO_EM = agora e REGISTRADO_POR = usuário logado.
 * Voltar um item para 'pendente' limpa EXECUTADO_EM/REGISTRADO_POR.
 * itens: [{ id, resultado, observacao }]
 */
function salvarChecklistChamado(chamadoId, itens) {
  try {
    return executarComLock(function () { return salvarChecklistChamado_(chamadoId, itens); });
  } catch (e) {
    return { sucesso: false, mensagem: 'Erro no servidor: ' + e.message };
  }
}

function salvarChecklistChamado_(chamadoId, itens) {
  const idChamado = Number(chamadoId);
  if (!idChamado) return { sucesso: false, mensagem: 'ID do chamado inválido.' };

  const chamado = ReadTickets().find(function (l) { return Number(l[0]) === idChamado; });
  if (!chamado) return { sucesso: false, mensagem: 'Chamado não encontrado (ID ' + idChamado + ').' };
  const status = String(chamado[ticketsStatusCol - 1] || '').trim().toLowerCase();
  if (status === 'concluido' || status === 'cancelado') {
    return { sucesso: false, mensagem: 'Chamado ' + (status === 'concluido' ? 'concluído' : 'cancelado') + ': reabra para alterar o checklist.' };
  }

  const pedidos = {};
  for (let i = 0; i < (itens || []).length; i++) {
    const it = itens[i];
    const resultado = String(it.resultado || '').trim().toLowerCase();
    if (RESULTADOS_CHECKLIST_CHAMADO.indexOf(resultado) === -1) {
      return { sucesso: false, mensagem: 'Resultado inválido no item ' + it.id + '.' };
    }
    pedidos[Number(it.id)] = { resultado: resultado, observacao: String(it.observacao || '').trim().slice(0, 500) };
  }

  const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ticketChecklistTableName);
  if (!aba) return { sucesso: false, mensagem: "Aba '" + ticketChecklistTableName + "' não encontrada." };

  const todas = ReadTicketChecklist();
  const indices = [];
  todas.forEach(function (l, idx) {
    if (Number(l[ticketChecklistChamadoIdCol - 1]) === idChamado && !l[ticketChecklistDataExclusaoCol - 1]) indices.push(idx);
  });
  if (!indices.length) return { sucesso: false, mensagem: 'Este chamado não tem checklist.' };

  // Bloco contínuo de linhas que contém os itens do chamado: lê cru,
  // altera só as células dos itens que mudaram e grava tudo de uma vez.
  const primeira = indices[0], ultima = indices[indices.length - 1];
  const bloco = aba.getRange(primeira + firstLineTicketChecklist, 1, ultima - primeira + 1, numColumnsTicketChecklist).getValues();

  const agora = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm');
  const hoje = agora.slice(0, 10);
  const usuario = nomeUsuarioLogado();
  let alterados = 0;

  indices.forEach(function (idx) {
    const linha = bloco[idx - primeira];
    const pedido = pedidos[Number(linha[ticketChecklistIdCol - 1])];
    if (!pedido) return;
    const resultadoAtual = String(linha[ticketChecklistResultadoCol - 1] || 'pendente').trim().toLowerCase();
    const obsAtual = String(linha[ticketChecklistObservacaoCol - 1] || '');
    if (pedido.resultado === resultadoAtual && pedido.observacao === obsAtual) return;

    linha[ticketChecklistResultadoCol - 1] = pedido.resultado;
    linha[ticketChecklistObservacaoCol - 1] = pedido.observacao;
    if (pedido.resultado === 'pendente') {
      linha[ticketChecklistExecutadoEmCol - 1] = '';
      linha[ticketChecklistRegistradoPorCol - 1] = '';
    } else {
      linha[ticketChecklistExecutadoEmCol - 1] = agora;
      linha[ticketChecklistRegistradoPorCol - 1] = usuario;
    }
    linha[ticketChecklistDataAlteracaoCol - 1] = hoje;
    alterados++;
  });

  if (!alterados) return { sucesso: true, mensagem: 'Nenhuma alteração no checklist.', alterados: 0 };

  aba.getRange(primeira + firstLineTicketChecklist, 1, bloco.length, numColumnsTicketChecklist).setValues(bloco);

  const resumo = resumoChecklist_(indices.map(function (idx) { return bloco[idx - primeira]; }));
  adicionarHistoricoSistema(idChamado, 'Checklist atualizado: ' + resumo.ok + ' ok, ' + resumo.nao_conforme +
    ' não conformes, ' + resumo.pendente + ' pendentes' + (resumo.nao_aplicavel ? ', ' + resumo.nao_aplicavel + ' não aplicáveis' : ''));

  return { sucesso: true, mensagem: 'Checklist salvo (' + alterados + ' item(ns) alterado(s)).', alterados: alterados, resumo: resumo };
}

/**
 * "Abrir corretiva" de um item não conforme: cria chamado corretivo para o
 * equipamento do item, ligado ao mesmo contrato da OS de origem, citando a
 * OS no motivo/observação. Não abre duas corretivas para o mesmo item.
 */
function abrirCorretivaItemChecklist(itemId) {
  try {
    return executarComLock(function () { return abrirCorretivaItemChecklist_(itemId); });
  } catch (e) {
    return { sucesso: false, mensagem: 'Erro no servidor: ' + e.message };
  }
}

function abrirCorretivaItemChecklist_(itemId) {
  const item = ReadTicketChecklist().find(function (l) {
    return Number(l[ticketChecklistIdCol - 1]) === Number(itemId) && !l[ticketChecklistDataExclusaoCol - 1];
  });
  if (!item) return { sucesso: false, mensagem: 'Item de checklist não encontrado.' };
  if (String(item[ticketChecklistResultadoCol - 1]).trim().toLowerCase() !== 'nao_conforme') {
    return { sucesso: false, mensagem: 'Só itens salvos como "Não conforme" podem gerar corretiva.' };
  }

  const osId = Number(item[ticketChecklistChamadoIdCol - 1]);
  const os = ReadTickets().find(function (l) { return Number(l[0]) === osId; });
  if (!os) return { sucesso: false, mensagem: 'OS de origem não encontrada.' };

  const marca = 'Corretiva aberta para o item ' + Number(itemId) + ' ';
  const jaAberta = ReadTicketHistorico().some(function (h) {
    return Number(h[ticketHistoricoChamadoIdCol - 1]) === osId && String(h[ticketHistoricoTextoCol - 1] || '').indexOf(marca) !== -1;
  });
  if (jaAberta) return { sucesso: false, mensagem: 'Já foi aberta uma corretiva para este item (veja o histórico da OS #' + osId + ').' };

  const descricaoItem = String(item[ticketChecklistDescricaoCol - 1] || '');
  const obs = String(item[ticketChecklistObservacaoCol - 1] || '');
  const resposta = salvarChamadoBackend_({
    motivo: 'Não conformidade: ' + descricaoItem,
    tipo: 'corretiva',
    classificacao: 'media',
    equipamentoId: item[ticketChecklistEquipamentoIdCol - 1],
    atribuidoA: os[ticketsAtribuidoCol - 1] || '',
    descricao: ('Aberta a partir da OS #' + osId + ' (' + (os[ticketsReasonCol - 1] || '') + ').' + (obs ? ' Obs.: ' + obs : '')).slice(0, 300)
  }, { contratoId: os[ticketsContratoIdCol - 1] });
  if (!resposta.sucesso) return resposta;

  adicionarHistoricoSistema(resposta.id, 'Aberta a partir da OS #' + osId + ', item "' + descricaoItem + '"');
  adicionarHistoricoSistema(osId, marca + '("' + descricaoItem + '"): chamado #' + resposta.id);

  return { sucesso: true, mensagem: 'Chamado corretivo #' + resposta.id + ' aberto.', id: resposta.id };
}
