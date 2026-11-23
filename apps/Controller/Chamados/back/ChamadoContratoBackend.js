// =====================================================
// CHAMADO x CONTRATO
// Descobre o contrato vigente que cobre um equipamento, a empresa
// (fornecedor) desse contrato e os prazos de SLA do chamado.
// Usado na abertura manual (salvarChamadoBackend), na tela de cadastro
// (verificarPatrimonioChamado) e na geração automática das preventivas.
// =====================================================

/**
 * Lê de uma vez as abas necessárias pra resolver contrato/fornecedor/SLA.
 * Quem processa muitos chamados (geração em lote) passa esse cache pras
 * funções abaixo pra não reler a planilha a cada item.
 */
function carregarCacheContratos_() {
  return {
    contratos: ReadContracts(),
    vinculos: ReadContractsEquipaments(),
    fornecedores: ReadSuppliers(),
    sla: ReadContractsSla()
  };
}

function contratoAtivoSemEncerramento_(linha) {
  return String(linha[contractActiveCol] || '').trim().toUpperCase() === 'Y' &&
    !linha[contractDataEncerramento] &&
    !linha[contractDataExclusaoCol];
}

// DATA_INICIAL <= data <= DATA_FINAL (comparando só o dia).
function contratoVigenteEm_(linha, data) {
  const ini = parseDataFlex(linha[contractDataInicialCol]);
  const fim = parseDataFlex(linha[contractDataFinalCol]);
  if (!ini || !fim) return false;
  const dia = inicioDoDia(data).getTime();
  return inicioDoDia(ini).getTime() <= dia && dia <= inicioDoDia(fim).getTime();
}

/**
 * Contrato ativo, sem DATA_ENCERRAMENTO, vigente na data e que tem o
 * equipamento em tbl_contratos_equipamentos (vínculo sem DATA_EXCLUSAO).
 * Mais de um: fica o de DATA_FINAL mais próxima e devolve um aviso.
 * Retorna { contrato: {...}, aviso } ou null.
 */
function buscarContratoVigentePorEquipamento(equipamentoId, data, cache) {
  const idEquip = Number(equipamentoId);
  if (!idEquip) return null;
  const dataRef = parseDataFlex(data) || new Date();
  const c = cache || carregarCacheContratos_();

  const idsContratosDoEquip = new Set(
    c.vinculos
      .filter(function (v) { return Number(v[contractEquipamentsIdEquipamentCol]) === idEquip && !v[contractsEquipamentsDataExclusaoCol]; })
      .map(function (v) { return Number(v[contractsEquipamentsIdContratoCol]); })
  );
  if (!idsContratosDoEquip.size) return null;

  const candidatos = c.contratos.filter(function (l) {
    return idsContratosDoEquip.has(Number(l[contractIdCol])) && contratoAtivoSemEncerramento_(l) && contratoVigenteEm_(l, dataRef);
  });
  if (!candidatos.length) return null;

  candidatos.sort(function (a, b) {
    return parseDataFlex(a[contractDataFinalCol]).getTime() - parseDataFlex(b[contractDataFinalCol]).getTime();
  });
  const escolhido = candidatos[0];
  const contrato = montarContratoResumo_(escolhido, c);

  const aviso = candidatos.length > 1
    ? 'Equipamento coberto por ' + candidatos.length + ' contratos vigentes (' +
      candidatos.map(function (l) { return l[contractNumberCol]; }).join(', ') +
      '). Usado o de data final mais próxima: ' + contrato.numero + '.'
    : '';

  return { contrato: contrato, aviso: aviso };
}

function montarContratoResumo_(linha, cache) {
  const empresa = String(linha[contractEmpresaCol] || '').trim();
  return {
    id: Number(linha[contractIdCol]),
    numero: String(linha[contractNumberCol] || ''),
    nome: String(linha[contractNameCol] || ''),
    sei: String(linha[contractSEICol] || ''),
    empresa: empresa,
    fornecedorId: buscarFornecedorIdPorNome_(empresa, cache.fornecedores)
  };
}

// EMPRESA do contrato é texto (razão social ou nome fantasia escolhido
// na tela) -- procura o ID em tbl_fornecedor pelos dois nomes.
function buscarFornecedorIdPorNome_(nome, fornecedores) {
  const alvo = String(nome || '').trim().toLowerCase();
  if (!alvo) return '';
  const f = (fornecedores || ReadSuppliers()).find(function (l) {
    return String(l[supplierRazaoSocialCol - 1] || '').trim().toLowerCase() === alvo ||
      String(l[supplierNameCol - 1] || '').trim().toLowerCase() === alvo;
  });
  return f ? f[supplierIdCol - 1] : '';
}

/**
 * Prazos do chamado a partir do SLA do contrato pra prioridade.
 * Devolve { prazoAtendimento, prazoSolucao } em 'dd/MM/yyyy HH:mm'
 * ('' quando o contrato não define aquele prazo).
 */
function calcularPrazosChamado(contratoId, prioridade, inicio, linhasSla) {
  const vazio = { prazoAtendimento: '', prazoSolucao: '' };
  if (!contratoId) return vazio;
  const sla = lerSlaContrato(contratoId, linhasSla)
    .find(function (s) { return s.prioridade === String(prioridade || '').trim().toLowerCase(); });
  if (!sla) return vazio;

  const fmt = function (d) { return Utilities.formatDate(d, Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm'); };
  return {
    prazoAtendimento: sla.prazoAtendimento === '' ? '' : fmt(somarHorasPrazo(inicio, sla.prazoAtendimento, sla.horasUteis)),
    prazoSolucao: sla.prazoSolucao === '' ? '' : fmt(somarHorasPrazo(inicio, sla.prazoSolucao, sla.horasUteis))
  };
}

function previewPrazosChamado(contratoId, prioridade) {
  try {
    if (!contratoId || !prioridade) return { prazoAtendimento: '', prazoSolucao: '' };
    return calcularPrazosChamado(Number(contratoId), prioridade, new Date());
  } catch (e) {
    return { prazoAtendimento: '', prazoSolucao: '' };
  }
}

/** Equipamentos (ativos ou não) cadastrados numa localização exata. */
function listarEquipamentosPorLocalizacao(localizacao) {
  const alvo = String(localizacao || '').trim().toLowerCase();
  if (!alvo) return [];
  return ReadEquipments()
    .filter(function (e) { return String(e[7] || '').trim().toLowerCase() === alvo; })
    .map(function (e) {
      return { id: e[0], nome: e[1] || '', marca: e[2] || '', capacidade: e[3] || '', modelo: e[4] || '', patrimonio: e[5] || '', localizacao: e[7] || '' };
    });
}

/**
 * Chamado pela tela de cadastro de chamado quando o patrimônio é
 * digitado: devolve o equipamento e, se houver, o contrato vigente hoje
 * (número/empresa) pra mostrar em modo somente leitura.
 */
function verificarPatrimonioChamado(patrimonio) {
  try {
    const equip = verificarPatrimonioEquipamento(patrimonio);
    if (!equip.existe) return { sucesso: true, existe: false };
    const vigente = buscarContratoVigentePorEquipamento(equip.id, new Date());
    return {
      sucesso: true,
      existe: true,
      equipamento: equip,
      contrato: vigente ? vigente.contrato : null,
      aviso: vigente ? vigente.aviso : ''
    };
  } catch (e) {
    return { sucesso: false, mensagem: 'Erro no servidor: ' + e.message };
  }
}

/**
 * Atraso de um chamado (linha de ReadTickets) em relação a "agora":
 * - DATA_PREVISTA < hoje e não concluído (preventivas);
 * - PRAZO_ATENDIMENTO vencido sem DATA_INICIO_ANDAMENTO;
 * - PRAZO_SOLUCAO vencido sem DATA_FINALIZACAO.
 * Cancelados e concluídos não ficam atrasados.
 * Retorna { atrasado, motivos: [...], prazoVencido (só SLA) }.
 */
function avaliarAtrasoChamado(linha, agora) {
  const resultado = { atrasado: false, motivos: [], prazoVencido: false };
  const status = String(linha[ticketsStatusCol - 1] || '').trim().toLowerCase();
  if (status === 'cancelado' || status === 'concluido') return resultado;
  const ref = agora || new Date();

  const prevista = parseDataFlex(linha[ticketsDataPrevistaCol - 1]);
  if (prevista && inicioDoDia(prevista) < inicioDoDia(ref)) resultado.motivos.push('data prevista vencida');

  const prazoAt = parseDataFlex(linha[ticketsPrazoAtendimentoCol - 1]);
  if (prazoAt && prazoAt < ref && !linha[ticketsDtInicioAndamentoCol - 1]) {
    resultado.motivos.push('prazo de atendimento vencido');
    resultado.prazoVencido = true;
  }
  const prazoSol = parseDataFlex(linha[ticketsPrazoSolucaoCol - 1]);
  if (prazoSol && prazoSol < ref && !linha[ticketsDtFinalizacaoCol - 1]) {
    resultado.motivos.push('prazo de solução vencido');
    resultado.prazoVencido = true;
  }
  resultado.atrasado = resultado.motivos.length > 0;
  return resultado;
}

function listarContratosParaFiltro() {
  return ReadContracts()
    .filter(function (l) { return l[contractIdCol] && !l[contractDataExclusaoCol]; })
    .map(function (l) {
      return {
        id: l[contractIdCol],
        numero: String(l[contractNumberCol] || ''),
        empresa: String(l[contractEmpresaCol] || ''),
        sei: String(l[contractSEICol] || '')
      };
    })
    .sort(function (a, b) { return a.numero.localeCompare(b.numero); });
}
