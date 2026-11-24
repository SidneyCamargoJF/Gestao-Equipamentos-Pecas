// =====================================================
// BACKEND - EQUIPAMENTOS DO CHAMADO (vários por chamado)
// Lista em tbl_chamado_equipamentos. A coluna ID_EQUIPAMENTO de
// tbl_chamados continua com o 1º equipamento da lista (ranking, agenda,
// consulta e chamados antigos dependem dela).
// =====================================================

function resumoEquipamentoChamado_(e) {
  return {
    id: Number(e[0]),
    nome: String(e[1] || ''),
    marca: String(e[2] || ''),
    capacidade: String(e[3] || ''),
    modelo: String(e[4] || ''),
    patrimonio: String(e[5] || ''),
    localizacao: String(e[7] || ''),
    estado: String(e[9] || '')
  };
}

function abaEquipamentosChamadoExiste_() {
  return !!SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ticketEquipTableName);
}

/** IDs dos equipamentos do chamado; sem lista gravada, usa a coluna B. */
function idsEquipamentosDoChamado_(chamadoId, equipamentoIdColunaB, linhasEquip) {
  const id = Number(chamadoId);
  const ids = (linhasEquip || ReadTicketEquipamentos())
    .filter(function (l) { return Number(l[ticketEquipChamadoIdCol - 1]) === id && !l[ticketEquipDataExclusaoCol - 1]; })
    .map(function (l) { return Number(l[ticketEquipEquipamentoIdCol - 1]); })
    .filter(function (v, i, arr) { return v && arr.indexOf(v) === i; });
  if (!ids.length && Number(equipamentoIdColunaB)) ids.push(Number(equipamentoIdColunaB));
  return ids;
}

function listarEquipamentosChamado_(chamadoId, equipamentoIdColunaB, equipamentos) {
  const porId = {};
  (equipamentos || ReadEquipments()).forEach(function (e) { porId[Number(e[0])] = e; });
  return idsEquipamentosDoChamado_(chamadoId, equipamentoIdColunaB).map(function (idEquip) {
    return porId[idEquip] ? resumoEquipamentoChamado_(porId[idEquip])
      : { id: idEquip, nome: 'Equipamento #' + idEquip, marca: '', capacidade: '', modelo: '', patrimonio: '', localizacao: '' };
  });
}

/**
 * Grava a lista de equipamentos do chamado: exclui (lógico) os que saíram e
 * acrescenta os novos. Chamada já dentro do lock de salvarChamadoBackend.
 * Sem a aba criada, só aceita 0 ou 1 equipamento (que já vai na coluna B).
 */
function salvarEquipamentosChamado_(chamadoId, ids) {
  const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ticketEquipTableName);
  if (!aba) {
    if ((ids || []).length > 1) throw new Error("Crie a aba '" + ticketEquipTableName + "' para registrar mais de um equipamento no chamado.");
    return;
  }
  const id = Number(chamadoId);
  const dataAtual = Utilities.formatDate(new Date(), 'GMT-3', 'dd/MM/yyyy');
  const desejados = (ids || []).map(Number).filter(function (v, i, arr) { return v && arr.indexOf(v) === i; });

  const linhas = ReadTicketEquipamentos();
  const ativos = {};
  linhas.forEach(function (l, i) {
    if (Number(l[ticketEquipChamadoIdCol - 1]) !== id || l[ticketEquipDataExclusaoCol - 1]) return;
    const idEquip = Number(l[ticketEquipEquipamentoIdCol - 1]);
    if (desejados.indexOf(idEquip) === -1 || ativos[idEquip]) {
      aba.getRange(i + firstLineTicketEquip, ticketEquipDataExclusaoCol).setValue(dataAtual);
    } else {
      ativos[idEquip] = true;
    }
  });

  const novos = desejados.filter(function (idEquip) { return !ativos[idEquip]; });
  if (!novos.length) return;
  const pos = proximoIdTabela(aba, firstLineTicketEquip);
  // ID, CHAMADO_ID, EQUIPAMENTO_ID, DATA_CADASTRO, DATA_EXCLUSAO, OBSERVACAO_ENCERRAMENTO
  const novasLinhas = novos.map(function (idEquip, i) { return [pos.novoId + i, id, idEquip, dataAtual, '', '']; });
  aba.getRange(pos.proximaLinha, 1, novasLinhas.length, numColumnsTicketEquip).setValues(novasLinhas);
}

/** Equipamentos ativos vinculados ao contrato (aba Equipamentos do contrato). */
function listarEquipamentosDoContrato(contratoId) {
  const id = Number(contratoId);
  if (!id) return [];
  const idsVinculados = {};
  ReadContractsEquipaments().forEach(function (v) {
    if (Number(v[contractsEquipamentsIdContratoCol]) === id && !v[contractsEquipamentsDataExclusaoCol]) {
      idsVinculados[Number(v[contractEquipamentsIdEquipamentCol])] = true;
    }
  });
  return ReadEquipments()
    .filter(function (e) { return idsVinculados[Number(e[0])] && String(e[8] || '').trim().toUpperCase() !== 'N'; })
    .map(resumoEquipamentoChamado_)
    .sort(function (a, b) { return a.patrimonio.localeCompare(b.patrimonio, 'pt-BR', { numeric: true }); });
}

// ===== OBSERVAÇÃO POR EQUIPAMENTO NO ENCERRAMENTO (preventiva) =====

/**
 * Equipamentos do chamado para o encerramento: a lista do chamado (ou a
 * coluna B) mais os equipamentos do checklist da OS. Traz a observação de
 * encerramento já gravada, se houver.
 */
function listarEquipamentosEncerramentoChamado(chamadoId) {
  try {
    const id = Number(chamadoId);
    if (!id) return { sucesso: false, mensagem: 'ID do chamado inválido.' };
    const chamado = ReadTickets().find(function (l) { return Number(l[ticketsIdCol - 1]) === id; });
    if (!chamado) return { sucesso: false, mensagem: 'Chamado não encontrado.' };

    return { sucesso: true, equipamentos: equipamentosOsComObservacao_(id, chamado[ticketsEquipamentoIdCol - 1]) };
  } catch (e) {
    return { sucesso: false, mensagem: 'Erro no servidor: ' + e.message };
  }
}

/**
 * Todos os equipamentos da OS -- lista do chamado (ou coluna B) mais os do
 * checklist --, cada um com a observação de encerramento gravada, em ordem
 * de patrimônio. Usado no encerramento e na aba Equipamentos do detalhe.
 */
function equipamentosOsComObservacao_(chamadoId, equipamentoIdColunaB, equipamentos) {
  const id = Number(chamadoId);
  const linhasEquip = ReadTicketEquipamentos();
  const ids = idsEquipamentosDoChamado_(id, equipamentoIdColunaB, linhasEquip);
  ReadTicketChecklist().forEach(function (l) {
    if (Number(l[ticketChecklistChamadoIdCol - 1]) !== id || l[ticketChecklistDataExclusaoCol - 1]) return;
    const idEquip = Number(l[ticketChecklistEquipamentoIdCol - 1]);
    if (idEquip && ids.indexOf(idEquip) === -1) ids.push(idEquip);
  });

  const observacoes = {};
  linhasEquip.forEach(function (l) {
    if (Number(l[ticketEquipChamadoIdCol - 1]) === id && !l[ticketEquipDataExclusaoCol - 1]) {
      observacoes[Number(l[ticketEquipEquipamentoIdCol - 1])] = String(l[ticketEquipObservacaoCol - 1] || '');
    }
  });

  const porId = {};
  (equipamentos || ReadEquipments()).forEach(function (e) { porId[Number(e[0])] = e; });
  return ids.map(function (idEquip) {
    const e = porId[idEquip];
    const r = e ? resumoEquipamentoChamado_(e)
      : { id: idEquip, nome: 'Equipamento #' + idEquip, marca: '', capacidade: '', modelo: '', patrimonio: '', localizacao: '', estado: '' };
    r.observacao = observacoes[idEquip] || '';
    return r;
  }).sort(function (a, b) { return a.patrimonio.localeCompare(b.patrimonio, 'pt-BR', { numeric: true }); });
}

/**
 * Grava a observação de encerramento de cada equipamento na coluna
 * OBSERVACAO_ENCERRAMENTO de tbl_chamado_equipamentos. Equipamento sem
 * linha na aba (OS automática, que usa o checklist) ganha a linha.
 * lista: [{ equipamentoId, observacao }]. Chamar dentro de executarComLock.
 * Devolve o texto para o histórico ('' se não havia observação).
 */
function salvarObservacoesEncerramentoChamado_(chamadoId, lista) {
  const id = Number(chamadoId);
  const itens = (lista || [])
    .map(function (o) { return { equipamentoId: Number(o && o.equipamentoId), observacao: String((o && o.observacao) || '').trim().slice(0, 500) }; })
    .filter(function (o) { return o.equipamentoId; });
  if (!itens.some(function (o) { return o.observacao; })) return '';

  const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ticketEquipTableName);
  if (!aba) throw new Error("Crie a aba '" + ticketEquipTableName + "' para gravar observação por equipamento.");

  const dataAtual = Utilities.formatDate(new Date(), 'GMT-3', 'dd/MM/yyyy');
  const linhas = ReadTicketEquipamentos();
  const linhaPorEquip = {};
  linhas.forEach(function (l, i) {
    if (Number(l[ticketEquipChamadoIdCol - 1]) === id && !l[ticketEquipDataExclusaoCol - 1]) {
      linhaPorEquip[Number(l[ticketEquipEquipamentoIdCol - 1])] = i + firstLineTicketEquip;
    }
  });

  const novas = [];
  itens.forEach(function (o) {
    const linha = linhaPorEquip[o.equipamentoId];
    if (linha) aba.getRange(linha, ticketEquipObservacaoCol).setValue(o.observacao);
    else if (o.observacao) novas.push(o);
  });
  if (novas.length) {
    const pos = proximoIdTabela(aba, firstLineTicketEquip);
    // ID, CHAMADO_ID, EQUIPAMENTO_ID, DATA_CADASTRO, DATA_EXCLUSAO, OBSERVACAO_ENCERRAMENTO
    const valores = novas.map(function (o, i) { return [pos.novoId + i, id, o.equipamentoId, dataAtual, '', o.observacao]; });
    aba.getRange(pos.proximaLinha, 1, valores.length, numColumnsTicketEquip).setValues(valores);
  }

  const porId = {};
  ReadEquipments().forEach(function (e) { porId[Number(e[0])] = e; });
  return itens.filter(function (o) { return o.observacao; }).map(function (o) {
    const e = porId[o.equipamentoId];
    const rotulo = e && e[5] ? 'Patrimônio ' + e[5] : 'Equipamento #' + o.equipamentoId;
    return '- ' + rotulo + ': ' + o.observacao;
  }).join('\n');
}
