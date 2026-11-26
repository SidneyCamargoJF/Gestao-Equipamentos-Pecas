// =====================================================
// GERAÇÃO AUTOMÁTICA DAS PREVENTIVAS
// Uma OS (chamado TIPO='preventiva', ORIGEM='automatica') por contrato por
// mês [PREMISSA A1], com os itens de checklist devidos naquele mês para
// cada equipamento ativo do contrato (tbl_chamado_checklist).
//
// Ciclo: dataBase = DATA_BASE_PREVENTIVA || DATA_INICIAL;
//   m = (anoComp - anoBase) * 12 + (mesComp - mesBase)
//   item devido quando m % intervalo(periodicidade) === 0
// O mês da data base (m = 0) é o mês 1 do ciclo: todos os itens entram
// [PREMISSA A2].
//
// Limite de 6 min do Apps Script: cada aba é lida uma vez, tudo é montado
// em memória e gravado em lote (um setValues por aba).
// =====================================================

const ORIGEM_CHAMADO_AUTOMATICA = 'automatica';

// 'AAAA-MM' -> { ano, mes } | null
function parseCompetencia_(competencia) {
  const m = String(competencia || '').trim().match(/^(\d{4})-(\d{2})$/);
  if (!m) return null;
  const ano = Number(m[1]), mes = Number(m[2]);
  if (mes < 1 || mes > 12) return null;
  return { ano: ano, mes: mes };
}

function competenciaAtual_() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM');
}

/**
 * Prazo da preventiva do contrato (coluna V): 'data_base' = no dia da data
 * base em cada mês devido; 'fim_mes' (padrão) = até o último dia do mês.
 */
function prazoPreventivaContrato_(linhaContrato) {
  return String(linhaContrato[contractPrazoPreventivaCol] || '').trim() === 'data_base' ? 'data_base' : 'fim_mes';
}

/** Data prevista da preventiva do contrato na competência (dia da data base ou fim do mês). */
function dataPrevistaPreventiva_(linhaContrato, dataBase, ano, mes) {
  const ultimo = new Date(ano, mes, 0);
  if (prazoPreventivaContrato_(linhaContrato) !== 'data_base' || !dataBase) return ultimo;
  return new Date(ano, mes - 1, Math.min(dataBase.getDate(), ultimo.getDate()));
}

/** Meses entre a data base e a competência (0 = mês da data base). */
function mesesDesdeBase(dataBase, ano, mes) {
  return (ano - dataBase.getFullYear()) * 12 + (mes - (dataBase.getMonth() + 1));
}

/** Itens (já lidos com lerItemChecklistContrato) devidos no mês m do ciclo. */
function itensDevidosNoMes(itens, m) {
  if (m < 0) return [];
  return itens.filter(function (item) {
    const intervalo = PERIODICIDADES[item.periodo];
    return intervalo && m % intervalo === 0;
  });
}

/**
 * Gera as OS de preventiva da competência ('AAAA-MM'; padrão = mês atual).
 * Pode rodar várias vezes no mesmo mês: contrato que já tem OS automática
 * na competência é pulado.
 * Também é o handler do gatilho diário (que passa um objeto de evento no
 * lugar da competência -- tratado como "mês atual").
 */
// contratoIds (opcional): gera só para estes contratos. O gatilho diário chama
// sem ele (recebe o objeto do evento no 1º parâmetro) e gera para todos.
function gerarPreventivasDoMes(competencia, contratoIds) {
  try {
    return executarComLock(function () {
      return gerarPreventivasDoMes_(typeof competencia === 'string' ? competencia : '', contratoIds);
    }, 60000);
  } catch (e) {
    console.error('gerarPreventivasDoMes: ' + e.message);
    return { sucesso: false, mensagem: 'Erro no servidor: ' + e.message };
  }
}

/**
 * O item do checklist do contrato vale para o equipamento? Item sem
 * categoria/tipo vale para todos; com, compara CATEGORIA com o NOME e TIPO
 * com o MODELO do equipamento (sem diferenciar maiúsculas) -- mesma regra
 * do serviço do contrato.
 */
function itemChecklistValeParaEquipamento_(item, equip) {
  const n = function (v) { return String(v || '').trim().toLowerCase(); };
  if (n(item.categoria) && (!equip || n(item.categoria) !== n(equip[1]))) return false;
  if (n(item.tipo) && (!equip || n(item.tipo) !== n(equip[4]))) return false;
  return true;
}

function gerarPreventivasDoMes_(competenciaInformada, contratoIds) {
  const competencia = competenciaInformada ? String(competenciaInformada).trim() : competenciaAtual_();
  const comp = parseCompetencia_(competencia);
  if (!comp) return { sucesso: false, mensagem: 'Competência inválida (use AAAA-MM): ' + competencia };
  const somenteContratos = Array.isArray(contratoIds)
    ? new Set(contratoIds.map(Number).filter(function (n) { return n > 0; }))
    : null;
  if (somenteContratos && !somenteContratos.size) return { sucesso: false, mensagem: 'Selecione ao menos um contrato.' };

  const primeiroDia = new Date(comp.ano, comp.mes - 1, 1);
  const ultimoDia = new Date(comp.ano, comp.mes, 0);
  const tz = Session.getScriptTimeZone();

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const abaChamados = ss.getSheetByName(ticketsTableName);
  const abaChecklist = ss.getSheetByName(ticketChecklistTableName);
  if (!abaChamados) return { sucesso: false, mensagem: "Aba '" + ticketsTableName + "' não encontrada." };
  if (!abaChecklist) return { sucesso: false, mensagem: "Aba '" + ticketChecklistTableName + "' não encontrada." };

  // ---- leitura: cada aba uma vez só
  const contratos = ReadContracts();
  const servicos = ReadContractsServicos();
  const checklists = ReadContractsChecklist();
  const vinculos = ReadContractsEquipaments();
  const fornecedores = ReadSuppliers();
  const chamados = ReadTickets();
  const equipPorId = {};
  const equipamentosAtivos = new Set(
    ReadEquipments()
      .filter(function (e) { return String(e[8] || '').trim().toUpperCase() !== 'N'; })
      .map(function (e) { equipPorId[Number(e[0])] = e; return Number(e[0]); })
  );

  const jaGeradas = new Set(
    chamados
      .filter(function (l) { return String(l[ticketsOrigemCol - 1] || '').trim().toLowerCase() === ORIGEM_CHAMADO_AUTOMATICA; })
      .map(function (l) { return Number(l[ticketsContratoIdCol - 1]) + '|' + String(l[ticketsCompetenciaCol - 1] || '').trim(); })
  );

  const contratosComPreventiva = new Set(
    servicos
      .filter(function (l) {
        return !l[contractsServicosDataExclusaoCol] &&
          String(l[contractsServicosTipoManutencaoCol] || '').trim().toLowerCase() === 'preventiva';
      })
      .map(function (l) { return Number(l[contractsServicosIdContratoCol]); })
  );

  // ---- montagem em memória
  const posChamado = proximoIdTabela(abaChamados, firstLineTickets);
  const posItem = proximoIdTabela(abaChecklist, firstLineTicketChecklist);
  const hoje = Utilities.formatDate(new Date(), tz, 'dd/MM/yyyy');

  const novasOS = [];
  const novosItens = [];
  const historico = [];
  const detalhes = [];

  contratos.forEach(function (c) {
    const contratoId = Number(c[contractIdCol]);
    if (!contratoId || !contratoAtivoSemEncerramento_(c)) return;
    if (somenteContratos && !somenteContratos.has(contratoId)) return;

    const ini = parseDataFlex(c[contractDataInicialCol]);
    const fim = parseDataFlex(c[contractDataFinalCol]);
    // vigente em algum dia da competência
    if (!ini || !fim || inicioDoDia(ini) > ultimoDia || inicioDoDia(fim) < primeiroDia) return;
    if (!contratosComPreventiva.has(contratoId)) return;

    const numero = String(c[contractNumberCol] || '');
    const registrar = function (situacao) { detalhes.push({ contratoId: contratoId, numero: numero, situacao: situacao }); };

    const dataBase = parseDataFlex(c[contractDataBasePreventivaCol]) || ini;
    const m = mesesDesdeBase(dataBase, comp.ano, comp.mes);
    if (m < 0) { registrar('antes da data base'); return; }

    const itensContrato = checklists
      .filter(function (l) { return Number(l[contractsChecklistIdContratoCol]) === contratoId && !l[contractsChecklistDataExclusaoCol]; })
      .map(lerItemChecklistContrato);
    const devidos = itensDevidosNoMes(itensContrato, m);
    if (!devidos.length) { registrar('nenhum item devido'); return; }

    if (jaGeradas.has(contratoId + '|' + competencia)) { registrar('já gerada'); return; }

    const equipamentos = [];
    vinculos.forEach(function (v) {
      const idEquip = Number(v[contractEquipamentsIdEquipamentCol]);
      if (Number(v[contractsEquipamentsIdContratoCol]) === contratoId && !v[contractsEquipamentsDataExclusaoCol] &&
          equipamentosAtivos.has(idEquip) && equipamentos.indexOf(idEquip) === -1) {
        equipamentos.push(idEquip);
      }
    });
    if (!equipamentos.length) { registrar('sem equipamentos ativos'); return; }

    // itens devidos de cada equipamento, conforme a categoria/tipo do item
    const itensPorEquip = {};
    let totalItens = 0;
    equipamentos.forEach(function (idEquip) {
      const itens = devidos.filter(function (item) { return itemChecklistValeParaEquipamento_(item, equipPorId[idEquip]); });
      if (itens.length) { itensPorEquip[idEquip] = itens; totalItens += itens.length; }
    });
    const equipComItens = equipamentos.filter(function (idEquip) { return itensPorEquip[idEquip]; });
    if (!equipComItens.length) { registrar('nenhum item devido para a categoria/tipo dos equipamentos'); return; }

    const empresa = String(c[contractEmpresaCol] || '').trim();
    const chamadoId = posChamado.novoId + novasOS.length;
    const dataPrevista = Utilities.formatDate(dataPrevistaPreventiva_(c, dataBase, comp.ano, comp.mes), tz, 'dd/MM/yyyy');

    // ID, ID_EQUIPAMENTO, MOTIVO, TIPO, PRIORIDADE, DATA_ABERTURA, ABERTO_POR,
    // ATRIBUIDO_A, DATA_INICIO_ANDAMENTO, DATA_FINALIZACAO, OBSERVACAO, STATUS,
    // DATA_ALTERACAO, CONTRATO_ID, ORIGEM, COMPETENCIA, DATA_PREVISTA,
    // PRAZO_ATENDIMENTO, PRAZO_SOLUCAO, FORNECEDOR_ID, DATA_EXCLUSAO
    novasOS.push([
      chamadoId, '', 'Preventiva ' + competencia + ' — ' + numero, 'preventiva', 'media', hoje, 'Sistema',
      empresa, '', '', '', 'Aberto', '', contratoId, ORIGEM_CHAMADO_AUTOMATICA,
      textoLiteralPlanilha(competencia), dataPrevista, '', '', buscarFornecedorIdPorNome_(empresa, fornecedores), ''
    ]);
    historico.push({ chamadoId: chamadoId, texto: 'Preventiva gerada automaticamente' });
    jaGeradas.add(contratoId + '|' + competencia);

    equipComItens.forEach(function (idEquip) {
      itensPorEquip[idEquip].forEach(function (item) {
        // ID, CHAMADO_ID, EQUIPAMENTO_ID, CHECKLIST_ID, DESCRICAO, PERIODICIDADE,
        // RESULTADO, OBSERVACAO, EXECUTADO_EM, REGISTRADO_POR, DATA_CADASTRO,
        // DATA_ALTERACAO, DATA_EXCLUSAO
        novosItens.push([
          posItem.novoId + novosItens.length, chamadoId, idEquip, item.id, item.descricao, item.periodo,
          'pendente', '', '', '', hoje, '', ''
        ]);
      });
    });
    registrar('gerada: chamado ' + chamadoId + ', ' + equipComItens.length + ' equipamento(s), ' + totalItens + ' item(ns)');
  });

  // ---- gravação em lote
  if (novasOS.length) {
    abaChamados.getRange(posChamado.proximaLinha, 1, novasOS.length, numColumnsTickets).setValues(novasOS);
    abaChecklist.getRange(posItem.proximaLinha, 1, novosItens.length, numColumnsTicketChecklist).setValues(novosItens);
    adicionarHistoricoSistemaLote(historico);
  }

  const mensagem = 'Competência ' + competencia + ': ' + novasOS.length + ' chamado(s) e ' + novosItens.length + ' itens de checklist criados.';
  console.log(mensagem);
  return {
    sucesso: true,
    mensagem: mensagem,
    competencia: competencia,
    osCriadas: novasOS.length,
    itensCriados: novosItens.length,
    detalhes: detalhes
  };
}

// ===== GATILHO DIÁRIO =====
// Rodar uma vez pelo editor do Apps Script (ou pela tela, via
// instalarGatilhoPreventivas). Gatilhos são de quem os instala: rode com a
// conta que deve "ser" o sistema.
function instalarGatilhoPreventivas() {
  try {
    const existente = ScriptApp.getProjectTriggers().some(function (t) {
      return t.getHandlerFunction() === 'gerarPreventivasDoMes';
    });
    if (existente) return { sucesso: true, mensagem: 'O gatilho diário das preventivas já está instalado.' };

    ScriptApp.newTrigger('gerarPreventivasDoMes')
      .timeBased()
      .everyDays(1)
      .atHour(6)
      .inTimezone('America/Sao_Paulo')
      .create();
    return { sucesso: true, mensagem: 'Gatilho diário instalado (todo dia às 06h).' };
  } catch (e) {
    return { sucesso: false, mensagem: 'Erro ao instalar o gatilho: ' + e.message };
  }
}

// ===== BOTÃO NA CONSULTA DE CHAMADOS =====
// Script Property ADMINS = e-mails separados por vírgula. Vazia = sem
// restrição (o sistema ainda não tem perfis de acesso).
function usuarioEhAdmin() {
  const lista = String(PropertiesService.getScriptProperties().getProperty('ADMINS') || '')
    .split(/[,;\s]+/).map(function (s) { return s.trim().toLowerCase(); }).filter(Boolean);
  if (!lista.length) return true;
  return lista.indexOf(emailUsuarioLogado_()) !== -1;
}

function gerarPreventivasDoMesManual(competencia, contratoIds) {
  if (!usuarioEhAdmin()) return { sucesso: false, mensagem: 'Somente administradores podem gerar as preventivas.' };
  return gerarPreventivasDoMes(typeof competencia === 'string' ? competencia : '', Array.isArray(contratoIds) ? contratoIds : undefined);
}
