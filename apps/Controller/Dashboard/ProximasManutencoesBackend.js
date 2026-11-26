// =====================================================
// DASHBOARD - PRÓXIMAS MANUTENÇÕES
// - "Abrir chamado": preventivas previstas (competência atual e próxima)
//   que ainda não têm a OS -- mesmas regras de gerarPreventivasDoMes_
//   (contrato vigente no mês, serviço Preventiva, itens do checklist
//   devidos pela periodicidade, equipamentos ativos da categoria/tipo),
//   só leitura.
// - "Agendar com a empresa": chamados preventivos ainda Abertos (nem em
//   andamento nem concluídos) com data prevista até o fim do mês seguinte,
//   com o último e-mail enviado à empresa (tbl_chamado_emails).
// =====================================================

function competenciaSomarMeses_(competencia, n) {
  const c = parseCompetencia_(competencia);
  const d = new Date(c.ano, c.mes - 1 + n, 1);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
}

/** Contratos com preventiva devida na competência: [{ contratoId, numero, empresa, equipamentos, itens, chamadoId }] */
function preventivasPrevistasNaCompetencia_(competencia, cache) {
  const comp = parseCompetencia_(competencia);
  if (!comp) return [];
  const primeiroDia = new Date(comp.ano, comp.mes - 1, 1);
  const ultimoDia = new Date(comp.ano, comp.mes, 0);
  const resultado = [];
  cache.contratos.forEach(function (c) {
    const contratoId = Number(c[contractIdCol]);
    if (!contratoId || !contratoAtivoSemEncerramento_(c)) return;
    const ini = parseDataFlex(c[contractDataInicialCol]);
    const fim = parseDataFlex(c[contractDataFinalCol]);
    if (!ini || !fim || inicioDoDia(ini) > ultimoDia || inicioDoDia(fim) < primeiroDia) return;
    if (!cache.contratosComPreventiva.has(contratoId)) return;
    const dataBase = parseDataFlex(c[contractDataBasePreventivaCol]) || ini;
    const m = mesesDesdeBase(dataBase, comp.ano, comp.mes);
    if (m < 0) return;
    const devidos = itensDevidosNoMes(cache.itensPorContrato[contratoId] || [], m);
    if (!devidos.length) return;
    let equipamentos = 0, itens = 0;
    (cache.equipPorContrato[contratoId] || []).forEach(function (idEquip) {
      const n = devidos.filter(function (item) { return itemChecklistValeParaEquipamento_(item, cache.equipPorId[idEquip]); }).length;
      if (n) { equipamentos++; itens += n; }
    });
    if (!equipamentos) return;
    resultado.push({
      contratoId: contratoId, numero: String(c[contractNumberCol] || ''), empresa: String(c[contractEmpresaCol] || '').trim(),
      equipamentos: equipamentos, itens: itens, competencia: competencia,
      dataPrevista: Utilities.formatDate(ultimoDia, Session.getScriptTimeZone(), 'dd/MM/yyyy'),
      chamadoId: cache.osPorContratoComp[contratoId + '|' + competencia] || null
    });
  });
  return resultado;
}

function cacheProximasManutencoes_() {
  const chamados = ReadTickets();
  const equipPorId = {};
  const ativos = new Set(ReadEquipments()
    .filter(function (e) { return String(e[8] || '').trim().toUpperCase() !== 'N'; })
    .map(function (e) { equipPorId[Number(e[0])] = e; return Number(e[0]); }));
  const equipPorContrato = {};
  ReadContractsEquipaments().forEach(function (v) {
    const cid = Number(v[contractsEquipamentsIdContratoCol]), eid = Number(v[contractEquipamentsIdEquipamentCol]);
    if (v[contractsEquipamentsDataExclusaoCol] || !ativos.has(eid)) return;
    if (!equipPorContrato[cid]) equipPorContrato[cid] = [];
    if (equipPorContrato[cid].indexOf(eid) === -1) equipPorContrato[cid].push(eid);
  });
  const itensPorContrato = {};
  ReadContractsChecklist().forEach(function (l) {
    if (l[contractsChecklistDataExclusaoCol]) return;
    const cid = Number(l[contractsChecklistIdContratoCol]);
    (itensPorContrato[cid] = itensPorContrato[cid] || []).push(lerItemChecklistContrato(l));
  });
  const osPorContratoComp = {};
  chamados.forEach(function (l) {
    if (String(l[ticketsOrigemCol - 1] || '').trim().toLowerCase() !== ORIGEM_CHAMADO_AUTOMATICA) return;
    osPorContratoComp[Number(l[ticketsContratoIdCol - 1]) + '|' + String(l[ticketsCompetenciaCol - 1] || '').trim()] = Number(l[0]);
  });
  return {
    chamados: chamados, contratos: ReadContracts(), equipPorId: equipPorId, equipPorContrato: equipPorContrato,
    itensPorContrato: itensPorContrato, osPorContratoComp: osPorContratoComp,
    contratosComPreventiva: new Set(ReadContractsServicos()
      .filter(function (l) { return !l[contractsServicosDataExclusaoCol] && String(l[contractsServicosTipoManutencaoCol] || '').trim().toLowerCase() === 'preventiva'; })
      .map(function (l) { return Number(l[contractsServicosIdContratoCol]); }))
  };
}

/** Painel "Próximas manutenções" do Dashboard. */
function buscarProximasManutencoes() {
  try {
    const cache = cacheProximasManutencoes_();
    const atual = competenciaAtual_();
    const competencias = [atual, competenciaSomarMeses_(atual, 1)];
    const hoje = inicioDoDia(new Date());
    const limite = new Date(hoje.getFullYear(), hoje.getMonth() + 2, 0);   // fim do mês seguinte

    // ----- abrir chamado
    const abrir = [];
    competencias.forEach(function (comp) {
      preventivasPrevistasNaCompetencia_(comp, cache).forEach(function (p) { if (!p.chamadoId) abrir.push(p); });
    });

    // ----- agendar com a empresa
    const emails = {};
    ReadTicketEmails().forEach(function (l) {
      if (String(l[ticketEmailDtExclusaoCol - 1] || '').trim()) return;
      emails[Number(l[ticketEmailChamadoIdCol - 1])] = { enviadoEm: String(l[ticketEmailEnviadoEmCol - 1] || ''), assunto: String(l[ticketEmailAssuntoCol - 1] || '') };
    });
    const contratos = {};
    cache.contratos.forEach(function (c) { contratos[Number(c[contractIdCol])] = { numero: String(c[contractNumberCol] || ''), empresa: String(c[contractEmpresaCol] || '') }; });
    const agendar = cache.chamados
      .filter(function (l) {
        if (String(l[ticketsTypeCol - 1] || '').trim().toLowerCase() !== 'preventiva') return false;
        if (String(l[ticketsStatusCol - 1] || '').trim().toLowerCase() !== 'aberto') return false;
        const prevista = parseDataFlex(l[ticketsDataPrevistaCol - 1]);
        return !prevista || inicioDoDia(prevista) <= limite;
      })
      .map(function (l) {
        const id = Number(l[0]);
        const prevista = parseDataFlex(l[ticketsDataPrevistaCol - 1]);
        const c = contratos[Number(l[ticketsContratoIdCol - 1])] || {};
        return {
          id: id, assunto: String(l[ticketsReasonCol - 1] || ''), contrato: c.numero || '', empresa: c.empresa || String(l[ticketsAtribuidoCol - 1] || ''),
          dataPrevista: String(l[ticketsDataPrevistaCol - 1] || ''), atrasado: !!prevista && inicioDoDia(prevista) < hoje,
          ultimoEmail: emails[id] || null, _ts: prevista ? prevista.getTime() : 0
        };
      })
      .sort(function (a, b) { return (a._ts || 9e15) - (b._ts || 9e15) || a.id - b.id; })
      .map(function (a) { delete a._ts; return a; });

    return { sucesso: true, competencias: competencias, abrir: abrir, agendar: agendar, admin: usuarioEhAdmin() };
  } catch (e) {
    return { sucesso: false, mensagem: 'Erro no servidor: ' + e.message, abrir: [], agendar: [] };
  }
}
