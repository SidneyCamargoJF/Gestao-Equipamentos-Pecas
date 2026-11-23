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
    localizacao: String(e[7] || '')
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
  // ID, CHAMADO_ID, EQUIPAMENTO_ID, DATA_CADASTRO, DATA_EXCLUSAO
  const novasLinhas = novos.map(function (idEquip, i) { return [pos.novoId + i, id, idEquip, dataAtual, '']; });
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
