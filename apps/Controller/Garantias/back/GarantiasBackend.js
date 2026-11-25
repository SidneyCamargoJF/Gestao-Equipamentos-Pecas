// =====================================================
// GARANTIAS -- abertura e controle do acionamento de garantia de uma peça
// ou de um produto do estoque (tbl_pecas, coluna TIPO).
//
// Fluxo do status:
//   Aberta -> Enviada ao fornecedor -> Em análise -> Atendida | Negada
//   (Cancelada a qualquer momento antes de encerrar; Atendida/Negada podem
//   ser reabertas, voltando para Em análise).
// Só abre com a garantia do item vigente (data final >= hoje) e sem outro
// acionamento em andamento para o mesmo item. Cada passo fica no histórico.
// =====================================================

const GARANTIA_STATUS = {
  ABERTA: 'Aberta',
  ENVIADA: 'Enviada ao fornecedor',
  ANALISE: 'Em análise',
  ATENDIDA: 'Atendida',
  NEGADA: 'Negada',
  CANCELADA: 'Cancelada'
};
const GARANTIA_RESULTADOS = { troca: 'Troca', reparo: 'Reparo', reembolso: 'Reembolso' };

function garantiaEncerrada_(status) {
  return [GARANTIA_STATUS.ATENDIDA, GARANTIA_STATUS.NEGADA, GARANTIA_STATUS.CANCELADA].indexOf(String(status || '')) !== -1;
}

function hojeGarantia_() { return Utilities.formatDate(new Date(), 'GMT-3', 'dd/MM/yyyy'); }
function agoraGarantia_() { return Utilities.formatDate(new Date(), 'GMT-3', 'dd/MM/yyyy HH:mm'); }

// 'yyyy-MM-dd' (input date) ou 'dd/MM/yyyy' -> 'dd/MM/yyyy' ('' se vazio; null se inválido)
function dataGarantiaTexto_(valor) {
  if (valor === undefined || valor === null || String(valor).trim() === '') return '';
  const d = parseDataFlex(valor);
  return d ? Utilities.formatDate(d, 'GMT-3', 'dd/MM/yyyy') : null;
}

function inicioDoDia_(d) { const x = new Date(d.getTime()); x.setHours(0, 0, 0, 0); return x; }

/** Cria as abas de garantia que ainda não existirem. */
function garantirAbasGarantias_() {
  return [
    criarAbaSeNaoExistir_(garantiasTableName, CABECALHO_GARANTIAS),
    criarAbaSeNaoExistir_(garantiaHistTableName, CABECALHO_GARANTIA_HIST),
    criarAbaSeNaoExistir_(garantiaAnexosTableName, CABECALHO_GARANTIA_ANEXOS)
  ];
}

// ===== ITEM (peça / produto) =====

function tipoItemTexto_(tipo) { return String(tipo || '').toLowerCase() === 'produto' ? 'Produto' : 'Peça'; }

/** Resumo de uma linha de tbl_pecas, com a situação da garantia. */
function resumoItemGarantia_(l) {
  const fim = parseDataFlex(l[partsDtGarantiaCol]);
  const hoje = inicioDoDia_(new Date());
  return {
    id: Number(l[partsIdCol]),
    nome: String(l[partsNameCol] || ''),
    tipo: String(l[partsTipoCol] || '').toLowerCase() === 'produto' ? 'produto' : 'peca',
    tipoTexto: tipoItemTexto_(l[partsTipoCol]),
    marca: String(l[partsBrandCol] || ''),
    modelo: String(l[partsModelCol] || ''),
    numeroSerie: String(l[partsNSCol] || ''),
    localizacao: String(l[partsLocalCol] || ''),
    fornecedor: String(l[partsSuplierCol] || ''),
    notaFiscal: String(l[partsNumNFCol] || ''),
    dataNota: l[partsDtNFCol] ? (dataGarantiaTexto_(l[partsDtNFCol]) || String(l[partsDtNFCol])) : '',
    garantia: String(l[partsGarantiaCol] || ''),
    garantiaAte: fim ? Utilities.formatDate(fim, 'GMT-3', 'dd/MM/yyyy') : '',
    vigente: !!fim && inicioDoDia_(fim) >= hoje,
    desativada: String(l[partsDtExclusaoCol] || '').trim() !== ''
  };
}

function itemGarantiaPorId_(pecaId) {
  const l = ReadParts().find(function (x) { return Number(x[partsIdCol]) === Number(pecaId); });
  return l ? resumoItemGarantia_(l) : null;
}

/** E-mail do fornecedor pelo nome gravado no item (razão social ou fantasia). */
function emailFornecedorPorNome_(nome) {
  const alvo = String(nome || '').trim().toLowerCase();
  if (!alvo) return '';
  const f = ReadSuppliers().find(function (l) {
    return [l[supplierRazaoSocialCol - 1], l[supplierNameCol - 1]].some(function (v) { return String(v || '').trim().toLowerCase() === alvo; });
  });
  return f ? String(f[supplierEmailCol - 1] || '').trim() : '';
}

// ===== LEITURA =====

function objetoGarantia_(l, itensPorId) {
  const status = String(l[garantiaStatusCol] || '');
  const prazo = parseDataFlex(l[garantiaPrazoRespostaCol]);
  const item = itensPorId[Number(l[garantiaPecaIdCol])] || null;
  return {
    id: Number(l[garantiaIdCol]),
    pecaId: Number(l[garantiaPecaIdCol]),
    item: item,
    fornecedor: String(l[garantiaFornecedorCol] || ''),
    dataAbertura: String(l[garantiaDtAberturaCol] || ''),
    defeito: String(l[garantiaDefeitoCol] || ''),
    protocolo: String(l[garantiaProtocoloCol] || ''),
    status: status,
    dataEnvio: String(l[garantiaDtEnvioCol] || ''),
    prazoResposta: String(l[garantiaPrazoRespostaCol] || ''),
    resultado: String(l[garantiaResultadoCol] || ''),
    resultadoTexto: GARANTIA_RESULTADOS[String(l[garantiaResultadoCol] || '')] || '',
    resolucao: String(l[garantiaResolucaoCol] || ''),
    dataEncerramento: String(l[garantiaDtEncerramentoCol] || ''),
    abertoPor: String(l[garantiaAbertoPorCol] || ''),
    encerrada: garantiaEncerrada_(status),
    atrasada: !garantiaEncerrada_(status) && !!prazo && inicioDoDia_(prazo) < inicioDoDia_(new Date())
  };
}

function mapaItensGarantia_() {
  const mapa = {};
  ReadParts().forEach(function (l) { mapa[Number(l[partsIdCol])] = resumoItemGarantia_(l); });
  return mapa;
}

/**
 * Consulta. filtros: { texto, status, tipo ('peca'|'produto'), fornecedor,
 * situacao ('andamento'|'atrasadas'|'encerradas') }. Canceladas só aparecem
 * filtrando pelo status Cancelada.
 */
function listarGarantias(filtros) {
  try {
    const f = filtros || {};
    const texto = String(f.texto || '').trim().toLowerCase();
    const fornecedor = String(f.fornecedor || '').trim().toLowerCase();
    const itens = mapaItensGarantia_();
    const lista = ReadGarantias()
      .filter(function (l) { return String(l[garantiaIdCol] || '').trim() !== ''; })
      .map(function (l) { return objetoGarantia_(l, itens); })
      .filter(function (g) {
        if (f.status) { if (g.status !== f.status) return false; }
        else if (g.status === GARANTIA_STATUS.CANCELADA) return false;
        if (f.tipo && (!g.item || g.item.tipo !== f.tipo)) return false;
        if (fornecedor && g.fornecedor.toLowerCase().indexOf(fornecedor) === -1) return false;
        if (f.situacao === 'andamento' && g.encerrada) return false;
        if (f.situacao === 'atrasadas' && !g.atrasada) return false;
        if (f.situacao === 'encerradas' && !g.encerrada) return false;
        if (texto) {
          const alvo = [String(g.id), g.defeito, g.protocolo, g.item ? g.item.nome : '', g.item ? g.item.numeroSerie : '',
            g.item ? g.item.modelo : ''].join(' ').toLowerCase();
          if (alvo.indexOf(texto) === -1) return false;
        }
        return true;
      });
    // em andamento primeiro (atrasadas no topo), depois as mais recentes
    lista.sort(function (a, b) {
      if (a.encerrada !== b.encerrada) return a.encerrada ? 1 : -1;
      if (a.atrasada !== b.atrasada) return a.atrasada ? -1 : 1;
      return b.id - a.id;
    });
    return { sucesso: true, garantias: lista };
  } catch (e) {
    return { sucesso: false, mensagem: 'Erro no servidor: ' + e.message, garantias: [] };
  }
}

function historicoGarantia_(garantiaId) {
  return ReadGarantiaHistorico()
    .filter(function (l) { return Number(l[garantiaHistGarantiaIdCol]) === Number(garantiaId) && !String(l[garantiaHistDtExclusaoCol] || '').trim(); })
    .map(function (l) {
      return { id: Number(l[garantiaHistIdCol]), texto: String(l[garantiaHistTextoCol] || ''), data: String(l[garantiaHistDataCol] || ''), usuario: String(l[garantiaHistUsuarioCol] || '') };
    })
    .reverse();
}

function buscarGarantiaDetalhada(idInput) {
  try {
    const id = Number(idInput);
    const l = ReadGarantias().find(function (x) { return Number(x[garantiaIdCol]) === id; });
    if (!l) return { sucesso: false, mensagem: 'Garantia não encontrada (nº ' + id + ').' };
    const itens = mapaItensGarantia_();
    const g = objetoGarantia_(l, itens);
    g.emailFornecedor = emailFornecedorPorNome_(g.fornecedor);
    g.historico = historicoGarantia_(id);
    return { sucesso: true, garantia: g };
  } catch (e) {
    return { sucesso: false, mensagem: 'Erro no servidor: ' + e.message };
  }
}

/** Para a tela de abertura: dados do item e se pode abrir. */
function verificarItemParaGarantia(pecaId) {
  try {
    const item = itemGarantiaPorId_(pecaId);
    if (!item) return { sucesso: false, mensagem: 'Peça/produto não encontrado.' };
    const aberta = ReadGarantias().find(function (l) {
      return Number(l[garantiaPecaIdCol]) === item.id && !garantiaEncerrada_(l[garantiaStatusCol]);
    });
    let motivo = '';
    if (item.desativada) motivo = 'Este item está desativado.';
    else if (aberta) motivo = 'Já existe a garantia nº ' + aberta[garantiaIdCol] + ' em andamento para este item.';
    else if (!item.garantiaAte) motivo = 'Este item não tem a data final da garantia cadastrada. Cadastre a data no item antes de abrir a garantia.';
    else if (!item.vigente) motivo = 'A garantia deste item venceu em ' + item.garantiaAte + '.';
    return {
      sucesso: true, item: item, podeAbrir: !motivo, motivo: motivo,
      garantiaAbertaId: aberta ? Number(aberta[garantiaIdCol]) : null,
      emailFornecedor: emailFornecedorPorNome_(item.fornecedor)
    };
  } catch (e) {
    return { sucesso: false, mensagem: 'Erro no servidor: ' + e.message };
  }
}

// ===== GRAVAÇÃO =====

function registrarHistoricoGarantia_(garantiaId, texto) {
  const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(garantiaHistTableName);
  const pos = proximoIdTabela(aba, firstLineGarantiaHist);
  aba.getRange(pos.proximaLinha, 1, 1, numColumnsGarantiaHist)
    .setValues([[pos.novoId, garantiaId, texto, agoraGarantia_(), nomeUsuarioLogado(), '']]);
}

/** { linha (na planilha), dados } da garantia, ou null. */
function localizarGarantia_(id) {
  const dados = ReadGarantias();
  const idx = dados.findIndex(function (l) { return Number(l[garantiaIdCol]) === Number(id); });
  return idx === -1 ? null : { linha: idx + firstLineGarantias, dados: dados[idx] };
}

function gravarCamposGarantia_(linha, campos) {
  const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(garantiasTableName);
  Object.keys(campos).forEach(function (col) { aba.getRange(linha, Number(col) + 1).setValue(campos[col]); });
  aba.getRange(linha, garantiaDtAlteracaoCol + 1).setValue(hojeGarantia_());
}

/** dados: { pecaId, defeito, prazoResposta } */
function abrirGarantia(dados) {
  try {
    return executarComLock(function () {
      garantirAbasGarantias_();
      const defeito = String((dados && dados.defeito) || '').trim();
      if (!defeito) return { sucesso: false, mensagem: 'Descreva o defeito.' };
      const prazo = dataGarantiaTexto_(dados.prazoResposta);
      if (prazo === null) return { sucesso: false, mensagem: 'Prazo de resposta inválido.' };

      const v = verificarItemParaGarantia(dados.pecaId);
      if (!v.sucesso) return v;
      if (!v.podeAbrir) return { sucesso: false, mensagem: v.motivo, garantiaAbertaId: v.garantiaAbertaId };

      const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(garantiasTableName);
      const pos = proximoIdTabela(aba, firstLineGarantias);
      const linha = [pos.novoId, v.item.id, v.item.fornecedor, hojeGarantia_(), defeito, '', GARANTIA_STATUS.ABERTA,
        '', prazo, '', '', '', nomeUsuarioLogado(), '', ''];
      aba.getRange(pos.proximaLinha, 1, 1, numColumnsGarantias).setValues([linha]);
      registrarHistoricoGarantia_(pos.novoId, 'Garantia aberta para ' + v.item.tipoTexto.toLowerCase() + ' "' + v.item.nome + '"' +
        (v.item.numeroSerie ? ' (NS ' + v.item.numeroSerie + ')' : '') + '. Defeito: ' + defeito);

      return {
        sucesso: true, id: pos.novoId, emailFornecedor: v.emailFornecedor,
        mensagem: 'Garantia nº ' + pos.novoId + ' aberta para ' + v.item.nome + '.'
      };
    });
  } catch (e) {
    return { sucesso: false, mensagem: 'Erro no servidor: ' + e.message };
  }
}

/**
 * Muda a situação. dados: { id, acao, protocolo, prazoResposta, resultado,
 * resolucao, motivo }
 *  acao 'enviar'   -> Enviada ao fornecedor (protocolo/prazo opcionais)
 *  acao 'analise'  -> Em análise
 *  acao 'atender'  -> Atendida (resultado: troca|reparo|reembolso)
 *  acao 'negar'    -> Negada (resolucao obrigatória)
 *  acao 'reabrir'  -> Em análise (motivo obrigatório; só de Atendida/Negada)
 *  acao 'cancelar' -> Cancelada (motivo obrigatório; exclusão lógica)
 *  acao 'atualizar'-> só protocolo e prazo de resposta
 */
function alterarGarantia(dados) {
  try {
    return executarComLock(function () { return alterarGarantia_(dados || {}); });
  } catch (e) {
    return { sucesso: false, mensagem: 'Erro no servidor: ' + e.message };
  }
}

function alterarGarantia_(dados) {
  const loc = localizarGarantia_(dados.id);
  if (!loc) return { sucesso: false, mensagem: 'Garantia não encontrada.' };
  const atual = String(loc.dados[garantiaStatusCol] || '');
  const encerrada = garantiaEncerrada_(atual);
  const acao = String(dados.acao || '');
  const campos = {};
  let historico = '';

  const protocolo = dados.protocolo === undefined ? undefined : String(dados.protocolo || '').trim();
  const prazo = dados.prazoResposta === undefined ? undefined : dataGarantiaTexto_(dados.prazoResposta);
  if (prazo === null) return { sucesso: false, mensagem: 'Prazo de resposta inválido.' };
  const complemento = function () {
    const partes = [];
    if (protocolo !== undefined && protocolo !== String(loc.dados[garantiaProtocoloCol] || '')) {
      campos[garantiaProtocoloCol] = protocolo; partes.push('protocolo ' + (protocolo || '(vazio)'));
    }
    if (prazo !== undefined && prazo !== String(loc.dados[garantiaPrazoRespostaCol] || '')) {
      campos[garantiaPrazoRespostaCol] = prazo; partes.push('prazo de resposta ' + (prazo || '(sem prazo)'));
    }
    return partes.length ? ' (' + partes.join(', ') + ')' : '';
  };

  if (acao === 'atualizar') {
    if (encerrada) return { sucesso: false, mensagem: 'Garantia encerrada: reabra antes de alterar.' };
    const c = complemento();
    if (!c) return { sucesso: false, mensagem: 'Nada foi alterado.' };
    historico = 'Dados atualizados' + c;
  } else if (acao === 'enviar') {
    if (atual !== GARANTIA_STATUS.ABERTA) return { sucesso: false, mensagem: 'Só uma garantia Aberta pode ser marcada como enviada.' };
    campos[garantiaStatusCol] = GARANTIA_STATUS.ENVIADA;
    campos[garantiaDtEnvioCol] = hojeGarantia_();
    historico = 'Enviada ao fornecedor' + complemento();
  } else if (acao === 'analise') {
    if (atual !== GARANTIA_STATUS.ENVIADA) return { sucesso: false, mensagem: 'Só uma garantia enviada ao fornecedor pode passar para Em análise.' };
    campos[garantiaStatusCol] = GARANTIA_STATUS.ANALISE;
    historico = 'Em análise pelo fornecedor' + complemento();
  } else if (acao === 'atender' || acao === 'negar') {
    if (encerrada) return { sucesso: false, mensagem: 'Esta garantia já está encerrada.' };
    const resolucao = String(dados.resolucao || '').trim();
    if (acao === 'atender') {
      if (!GARANTIA_RESULTADOS[dados.resultado]) return { sucesso: false, mensagem: 'Escolha como a garantia foi atendida (troca, reparo ou reembolso).' };
      campos[garantiaStatusCol] = GARANTIA_STATUS.ATENDIDA;
      campos[garantiaResultadoCol] = dados.resultado;
      historico = 'Garantia atendida: ' + GARANTIA_RESULTADOS[dados.resultado] + (resolucao ? '. ' + resolucao : '');
    } else {
      if (!resolucao) return { sucesso: false, mensagem: 'Informe o motivo da negativa.' };
      campos[garantiaStatusCol] = GARANTIA_STATUS.NEGADA;
      campos[garantiaResultadoCol] = 'negada';
      historico = 'Garantia negada pelo fornecedor. ' + resolucao;
    }
    campos[garantiaResolucaoCol] = resolucao;
    campos[garantiaDtEncerramentoCol] = hojeGarantia_();
    historico += complemento();
  } else if (acao === 'reabrir') {
    if (atual !== GARANTIA_STATUS.ATENDIDA && atual !== GARANTIA_STATUS.NEGADA) return { sucesso: false, mensagem: 'Só uma garantia Atendida ou Negada pode ser reaberta.' };
    const motivo = String(dados.motivo || '').trim();
    if (!motivo) return { sucesso: false, mensagem: 'Informe o motivo da reabertura.' };
    campos[garantiaStatusCol] = GARANTIA_STATUS.ANALISE;
    campos[garantiaResultadoCol] = '';
    campos[garantiaResolucaoCol] = '';
    campos[garantiaDtEncerramentoCol] = '';
    historico = 'Garantia reaberta. Motivo: ' + motivo;
  } else if (acao === 'cancelar') {
    if (encerrada) return { sucesso: false, mensagem: 'Esta garantia já está encerrada.' };
    const motivo = String(dados.motivo || '').trim();
    if (!motivo) return { sucesso: false, mensagem: 'Informe o motivo do cancelamento.' };
    campos[garantiaStatusCol] = GARANTIA_STATUS.CANCELADA;
    campos[garantiaDtEncerramentoCol] = hojeGarantia_();
    campos[garantiaDtExclusaoCol] = hojeGarantia_();
    historico = 'Garantia cancelada. Motivo: ' + motivo;
  } else {
    return { sucesso: false, mensagem: 'Ação inválida.' };
  }

  gravarCamposGarantia_(loc.linha, campos);
  registrarHistoricoGarantia_(Number(dados.id), historico);
  const mensagens = {
    atualizar: 'Dados da garantia atualizados.', enviar: 'Garantia marcada como enviada ao fornecedor.',
    analise: 'Garantia marcada como em análise.', atender: 'Garantia encerrada como atendida.',
    negar: 'Garantia encerrada como negada.', reabrir: 'Garantia reaberta.', cancelar: 'Garantia cancelada.'
  };
  return { sucesso: true, mensagem: mensagens[acao], status: campos[garantiaStatusCol] || atual };
}

function adicionarAnotacaoGarantia(garantiaId, texto) {
  try {
    const t = String(texto || '').trim();
    if (!t) return { sucesso: false, mensagem: 'Digite a anotação.' };
    return executarComLock(function () {
      if (!localizarGarantia_(garantiaId)) return { sucesso: false, mensagem: 'Garantia não encontrada.' };
      registrarHistoricoGarantia_(Number(garantiaId), t);
      return { sucesso: true, mensagem: 'Anotação adicionada.' };
    });
  } catch (e) {
    return { sucesso: false, mensagem: 'Erro no servidor: ' + e.message };
  }
}

// ===== ANEXOS (laudo, fotos, NF -- pasta de anexos do Drive) =====

function adicionarAnexoGarantia(garantiaId, tipo, arquivo) {
  try {
    return executarComLock(function () {
      garantirAbasGarantias_();
      if (!localizarGarantia_(garantiaId)) return { sucesso: false, mensagem: 'Garantia não encontrada.' };
      const r = adicionarAnexoGenerico({
        tabelaAnexos: garantiaAnexosTableName, idRegistro: Number(garantiaId), tipo: tipo || 'Documento', arquivo: arquivo,
        firstLine: firstLineGarantiaAnexos, numColumns: numColumnsGarantiaAnexos
      });
      if (r.sucesso) registrarHistoricoGarantia_(Number(garantiaId), 'Anexo adicionado (' + (tipo || 'Documento') + '): ' + r.nomeArquivo);
      return r;
    });
  } catch (e) {
    return { sucesso: false, mensagem: 'Erro no servidor: ' + e.message };
  }
}

function buscarAnexosGarantia(garantiaId) {
  try {
    if (!SpreadsheetApp.getActiveSpreadsheet().getSheetByName(garantiaAnexosTableName)) return [];
    return buscarAnexosGenerico(garantiaAnexosTableName, garantiaId, firstLineGarantiaAnexos, numColumnsGarantiaAnexos);
  } catch (e) {
    return [];
  }
}

function excluirAnexoGarantia(anexoId) {
  try {
    return executarComLock(function () {
      const r = excluirAnexoGenerico(garantiaAnexosTableName, anexoId, firstLineGarantiaAnexos, numColumnsGarantiaAnexos);
      if (r && r.sucesso && r.idRegistro) registrarHistoricoGarantia_(Number(r.idRegistro), 'Anexo excluído: ' + (r.nomeArquivo || ''));
      return r;
    });
  } catch (e) {
    return { sucesso: false, mensagem: 'Erro no servidor: ' + e.message };
  }
}

// ===== E-MAIL AO FORNECEDOR (mesma tela/modelos do chamado) =====

function valoresCamposEmailGarantia_(g) {
  const it = g.item || {};
  return {
    numero_garantia: String(g.id),
    item: it.nome || '',
    tipo_item: it.tipoTexto || '',
    marca: it.marca || '',
    modelo: it.modelo || '',
    numero_serie: it.numeroSerie || '',
    nota_fiscal: it.notaFiscal || '',
    data_nota: it.dataNota || '',
    garantia_ate: it.garantiaAte || '',
    fornecedor: g.fornecedor || '',
    defeito: g.defeito || '',
    data_abertura: g.dataAbertura || '',
    protocolo: g.protocolo || '',
    prazo_resposta: g.prazoResposta || '',
    usuario: nomeUsuarioLogado(),
    data_hoje: hojeGarantia_()
  };
}

function prepararEmailGarantia(garantiaId) {
  try {
    const det = buscarGarantiaDetalhada(garantiaId);
    if (!det.sucesso) return det;
    const g = det.garantia;
    const lista = listarModelosEmail('garantia');
    return {
      sucesso: true, contexto: 'garantia', registroId: g.id,
      para: g.emailFornecedor || '', empresa: g.fornecedor || '',
      valores: valoresCamposEmailGarantia_(g),
      modelos: lista.modelos || [], campos: camposModeloEmail_('garantia'),
      ultimoEmail: null
    };
  } catch (e) {
    return { sucesso: false, mensagem: 'Erro no servidor: ' + e.message };
  }
}

/** dados: { garantiaId, para, cc, assunto, corpo, confirmacaoLeitura } */
function enviarEmailGarantia(dados) {
  try {
    const id = Number(dados && dados.garantiaId);
    const loc = id ? localizarGarantia_(id) : null;
    if (!loc) return { sucesso: false, mensagem: 'Garantia não encontrada.' };
    const v = validarEmailDigitado_(dados);
    if (!v.sucesso) return v;
    const envio = enviarEmailComConfirmacao_(v.para, v.cc, v.assunto, v.corpo, dados.confirmacaoLeitura !== false);

    let mensagem = 'E-mail enviado para ' + v.para.join(', ') + '.';
    executarComLock(function () {
      registrarHistoricoGarantia_(id, 'E-mail enviado para ' + v.para.join(', ') + (v.cc.length ? ' (cópia: ' + v.cc.join(', ') + ')' : '') +
        (envio.confirmacao ? ', com confirmação de leitura solicitada' : '') + '. Assunto: ' + v.assunto);
      // Aberta + e-mail ao fornecedor = enviada
      if (String(loc.dados[garantiaStatusCol]) === GARANTIA_STATUS.ABERTA) {
        gravarCamposGarantia_(loc.linha, { [garantiaStatusCol]: GARANTIA_STATUS.ENVIADA, [garantiaDtEnvioCol]: hojeGarantia_() });
        registrarHistoricoGarantia_(id, 'Enviada ao fornecedor (por e-mail)');
        mensagem += '\nA garantia passou para "Enviada ao fornecedor".';
      }
    });
    if (envio.confirmacao) mensagem += '\nConfirmação de leitura solicitada: se o destinatário aceitar, ela chega na sua caixa de entrada.';
    if (envio.aviso) mensagem += '\n' + envio.aviso;
    return { sucesso: true, mensagem: mensagem, confirmacaoLeitura: envio.confirmacao };
  } catch (e) {
    return { sucesso: false, mensagem: 'Erro ao enviar o e-mail: ' + e.message };
  }
}

// ===== AGENDA E DASHBOARD =====

/** Garantias em andamento com prazo de resposta no período (Agenda). */
function eventosAgendaGarantias_(inicio, fim) {
  const itens = mapaItensGarantia_();
  const eventos = [];
  ReadGarantias().forEach(function (l) {
    if (garantiaEncerrada_(l[garantiaStatusCol])) return;
    const prazo = parseDataFlex(l[garantiaPrazoRespostaCol]);
    if (!prazo || prazo < inicio || prazo > fim) return;
    const item = itens[Number(l[garantiaPecaIdCol])];
    eventos.push({
      tipo: 'garantia',
      data: Utilities.formatDate(prazo, 'GMT-3', 'yyyy-MM-dd'),
      id: Number(l[garantiaIdCol]),
      titulo: 'Garantia nº ' + l[garantiaIdCol] + ' — ' + (item ? item.nome : 'item ' + l[garantiaPecaIdCol]) +
        ' (' + l[garantiaStatusCol] + ', prazo de resposta)'
    });
  });
  return eventos;
}

/** Indicadores do Dashboard (seção Peças). */
function indicadoresGarantias_() {
  const r = listarGarantias({ situacao: 'andamento' });
  const andamento = r.garantias || [];
  const porStatus = {};
  andamento.forEach(function (g) { porStatus[g.status] = (porStatus[g.status] || 0) + 1; });
  return {
    andamento: andamento.length,
    atrasadas: andamento.filter(function (g) { return g.atrasada; }).length,
    porStatus: porStatus,
    lista: andamento.slice(0, 8).map(function (g) {
      return { id: g.id, item: g.item ? g.item.nome : '', status: g.status, prazoResposta: g.prazoResposta, atrasada: g.atrasada };
    })
  };
}
