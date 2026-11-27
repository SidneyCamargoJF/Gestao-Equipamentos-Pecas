// =====================================================
// PEDIDOS (Compras > Pedidos)
// - Relatório/intenção de compra: NÃO mexe no estoque sozinho -- a entrada
//   de verdade só acontece quando a nota fiscal da compra é lançada (ver
//   EstoqueBackend.js / sincronizarEntradasNota_). Pedido aqui é só pra
//   organizar "o que precisamos comprar" e guardar o histórico disso.
// - "Gerar lista de pedidos" (tela de Estoque) traz sugestão pronta com
//   tudo que está abaixo do mínimo ou zerado; a pessoa pode tirar/ajustar
//   quantidade e incluir outros itens na mão antes de salvar.
// - Status: Aberto -> Enviado -> Recebido (ou Cancelado a qualquer momento).
// =====================================================

function garantirAbasPedidos_() {
  return [
    criarAbaSeNaoExistir_(pedidosTableName, CABECALHO_PEDIDOS),
    criarAbaSeNaoExistir_(pedidoItensTableName, CABECALHO_PEDIDOS_ITENS)
  ];
}

function hojePedido_() { return Utilities.formatDate(new Date(), 'GMT-3', 'dd/MM/yyyy'); }

// DATA_PEDIDO vem como 'dd/MM/yyyy' -- o <input type="date"> da tela
// precisa de 'yyyy-MM-dd'.
function dataPedidoParaInput_(valor) {
  const m = String(valor || '').trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return m ? (m[3] + '-' + m[2] + '-' + m[1]) : '';
}

function numeroPedido_(v) {
  if (v === '' || v === null || v === undefined) return '';
  const n = typeof v === 'number' ? v : Number(String(v).trim().replace(/\./g, '').replace(',', '.'));
  return isFinite(n) ? n : '';
}

function mapaPecasPedido_() {
  const mapa = {};
  ReadParts().forEach(function (l) {
    mapa[Number(l[partsIdCol])] = {
      id: Number(l[partsIdCol]), nome: String(l[partsNameCol] || ''), marca: String(l[partsBrandCol] || ''),
      modelo: String(l[partsModelCol] || ''), tipo: tipoItemEstoque_(l[partsTipoCol]),
      fornecedor: String(l[partsSuplierCol] || ''), valor: l[partsValueCol] === '' ? '' : Number(l[partsValueCol]),
      desativada: String(l[partsDtExclusaoCol] || '').trim() !== ''
    };
  });
  return mapa;
}

// ===== SUGESTÃO PARA O BOTÃO "GERAR LISTA DE PEDIDOS" =====

/**
 * Itens abaixo do mínimo ou zerados, prontos pra virar um pedido novo:
 * quantidade sugerida = o que falta pra voltar ao mínimo (pelo menos 1).
 */
function gerarSugestaoPedido() {
  try {
    const r = listarEstoque({});
    if (!r.sucesso) return { sucesso: false, mensagem: r.mensagem, itens: [] };
    const itens = r.itens
      .filter(function (it) { return it.situacao === 'abaixo' || it.situacao === 'zerado'; })
      .map(function (it) {
        const minimo = it.minimo === '' ? 0 : Number(it.minimo);
        const faltam = Math.max(1, Math.round((minimo - it.saldo) * 10000) / 10000);
        return montarItemSugeridoPedido_(it.id, faltam);
      })
      .filter(function (i) { return i !== null; });
    return { sucesso: true, itens: itens };
  } catch (e) {
    return { sucesso: false, mensagem: 'Erro no servidor: ' + e.message, itens: [] };
  }
}

/** Monta um item pra tela (sugestão ou adicionado na mão), com dados atuais da peça/estoque. */
function montarItemSugeridoPedido_(pecaId, quantidadeSugerida) {
  const pecas = mapaPecasPedido_();
  const p = pecas[Number(pecaId)];
  if (!p) return null;
  const saldos = saldosEstoque_()[Number(pecaId)] || { saldo: 0 };
  const params = parametrosEstoque_()[Number(pecaId)] || { minimo: '', unidade: 'UN' };
  return {
    pecaId: p.id, nome: p.nome, marca: p.marca, modelo: p.modelo, tipo: p.tipo,
    fornecedor: p.fornecedor, precoUnitario: p.valor,
    saldoAtual: saldos.saldo, estoqueMinimo: params.minimo, unidade: params.unidade || 'UN',
    quantidade: quantidadeSugerida === undefined ? 1 : quantidadeSugerida
  };
}

/** Monta um item (quantidade sugerida = 1) pra incluir na tela quando a pessoa escolhe um produto na busca manual. */
function montarItemParaAdicionarPedido(pecaId) {
  try {
    const item = montarItemSugeridoPedido_(pecaId, 1);
    if (!item) return { sucesso: false, mensagem: 'Produto não encontrado.' };
    return { sucesso: true, item: item };
  } catch (e) {
    return { sucesso: false, mensagem: 'Erro no servidor: ' + e.message };
  }
}

/** Busca de produto pra incluir manualmente na lista (campo de busca da tela). */
function buscarItensParaPedido(texto) {
  try {
    const t = String(texto || '').trim().toLowerCase();
    const pecas = mapaPecasPedido_();
    const lista = Object.keys(pecas).map(function (k) { return pecas[k]; })
      .filter(function (p) { return !p.desativada && (!t || [p.nome, p.marca, p.modelo].join(' ').toLowerCase().indexOf(t) !== -1); })
      .sort(function (a, b) { return a.nome.localeCompare(b.nome, 'pt-BR'); })
      .slice(0, 30);
    return { sucesso: true, itens: lista };
  } catch (e) {
    return { sucesso: false, mensagem: 'Erro no servidor: ' + e.message, itens: [] };
  }
}

// ===== CONSULTA =====

function itensAtivosPedido_(pedidoId, todos) {
  return (todos || ReadPedidosItens()).filter(function (l) {
    return Number(l[pedidoItemPedidoIdCol]) === Number(pedidoId) && !String(l[pedidoItemDtExclusaoCol] || '').trim();
  });
}

/** filtros: { texto, status, de, ate (yyyy-MM-dd) } */
function listarPedidos(filtros) {
  try {
    const f = filtros || {};
    const texto = String(f.texto || '').trim().toLowerCase();
    const de = parseDataFlex(f.de), ate = parseDataFlex(f.ate);
    const pecas = mapaPecasPedido_();
    const todosItens = ReadPedidosItens();
    const lista = ReadPedidos()
      .filter(function (l) { return String(l[pedidoIdCol] || '').trim() !== ''; })
      .map(function (l) {
        const id = Number(l[pedidoIdCol]);
        const its = itensAtivosPedido_(id, todosItens);
        const fornecedores = [...new Set(its.map(function (i) { return String(i[pedidoItemFornecedorCol] || '').trim(); }).filter(Boolean))];
        const nomes = its.map(function (i) { return (pecas[Number(i[pedidoItemPecaIdCol])] || {}).nome || ''; });
        return {
          id: id, data: String(l[pedidoDataCol] || ''), status: String(l[pedidoStatusCol] || 'aberto'),
          statusTexto: STATUS_PEDIDO[String(l[pedidoStatusCol] || 'aberto')] || String(l[pedidoStatusCol] || ''),
          observacao: String(l[pedidoObservacaoCol] || ''), usuario: String(l[pedidoUsuarioCol] || ''),
          valorTotal: l[pedidoValorTotalCol] === '' ? 0 : Number(l[pedidoValorTotalCol]),
          qtdItens: its.length, fornecedores: fornecedores.join(', '),
          desativado: String(l[pedidoDtExclusaoCol] || '').trim() !== '',
          _busca: [l[pedidoObservacaoCol], fornecedores.join(' '), nomes.join(' ')].join(' ').toLowerCase()
        };
      })
      .filter(function (p) {
        if (!f.incluirDesativados && p.desativado) return false;
        if (f.status && p.status !== f.status) return false;
        if (texto && p._busca.indexOf(texto) === -1) return false;
        const d = parseDataFlex(p.data);
        if (de && (!d || d < de)) return false;
        if (ate && (!d || d > ate)) return false;
        return true;
      })
      .map(function (p) { delete p._busca; return p; })
      .sort(function (a, b) {
        const da = parseDataFlex(a.data), db = parseDataFlex(b.data);
        return ((db ? db.getTime() : 0) - (da ? da.getTime() : 0)) || b.id - a.id;
      });
    return { sucesso: true, pedidos: lista };
  } catch (e) {
    return { sucesso: false, mensagem: 'Erro no servidor: ' + e.message, pedidos: [] };
  }
}

function buscarPedidoDetalhado(idInput) {
  try {
    const id = Number(idInput);
    const l = ReadPedidos().find(function (x) { return Number(x[pedidoIdCol]) === id; });
    if (!l) return { sucesso: false, mensagem: 'Pedido não encontrado.' };
    const pecas = mapaPecasPedido_();
    const saldos = saldosEstoque_();
    const itens = itensAtivosPedido_(id).map(function (i) {
      const pecaId = Number(i[pedidoItemPecaIdCol]);
      const p = pecas[pecaId] || {};
      return {
        id: Number(i[pedidoItemIdCol]), pecaId: pecaId, nome: p.nome || ('item ' + pecaId), marca: p.marca || '', modelo: p.modelo || '',
        fornecedor: String(i[pedidoItemFornecedorCol] || ''), quantidade: Number(i[pedidoItemQuantidadeCol]) || 0,
        precoUnitario: i[pedidoItemPrecoUnitCol] === '' ? '' : Number(i[pedidoItemPrecoUnitCol]),
        saldoNoMomento: i[pedidoItemSaldoMomentoCol] === '' ? '' : Number(i[pedidoItemSaldoMomentoCol]),
        estoqueMinimoNoMomento: i[pedidoItemMinimoMomentoCol] === '' ? '' : Number(i[pedidoItemMinimoMomentoCol]),
        saldoAtual: (saldos[pecaId] || { saldo: 0 }).saldo,
        observacao: String(i[pedidoItemObservacaoCol] || '')
      };
    });
    return {
      sucesso: true,
      pedido: {
        id: id, data: String(l[pedidoDataCol] || ''), dataInput: dataPedidoParaInput_(l[pedidoDataCol]), status: String(l[pedidoStatusCol] || 'aberto'),
        observacao: String(l[pedidoObservacaoCol] || ''), usuario: String(l[pedidoUsuarioCol] || ''),
        valorTotal: l[pedidoValorTotalCol] === '' ? 0 : Number(l[pedidoValorTotalCol]),
        desativado: String(l[pedidoDtExclusaoCol] || '').trim() !== '', itens: itens
      }
    };
  } catch (e) {
    return { sucesso: false, mensagem: 'Erro no servidor: ' + e.message };
  }
}

// ===== GRAVAÇÃO =====

/**
 * dados: { id, data, status, observacao, itens: [{ pecaId, fornecedor,
 * quantidade, precoUnitario, observacao }] }
 */
function salvarPedido(dados) {
  try {
    return executarComLock(function () { return salvarPedido_(dados || {}); });
  } catch (e) {
    return { sucesso: false, mensagem: 'Erro no servidor: ' + e.message };
  }
}

function salvarPedido_(d) {
  garantirAbasPedidos_();
  const data = d.data ? parseDataFlex(d.data) : new Date();
  if (!data) return { sucesso: false, mensagem: 'Data do pedido inválida.' };
  const status = STATUS_PEDIDO[String(d.status || 'aberto')] ? String(d.status) : 'aberto';
  const observacao = String(d.observacao || '').trim();

  const pecas = mapaPecasPedido_();
  const saldos = saldosEstoque_();
  const params = parametrosEstoque_();
  const listaItens = Array.isArray(d.itens) ? d.itens : [];
  const itens = [];
  for (let i = 0; i < listaItens.length; i++) {
    const it = listaItens[i] || {};
    const pecaId = Number(it.pecaId);
    if (!pecaId || !pecas[pecaId]) return { sucesso: false, mensagem: 'Item ' + (i + 1) + ': escolha um produto do cadastro.' };
    const quantidade = numeroPedido_(it.quantidade);
    if (quantidade === '' || quantidade <= 0) return { sucesso: false, mensagem: 'Item ' + (i + 1) + ' (' + pecas[pecaId].nome + '): informe uma quantidade maior que zero.' };
    const preco = it.precoUnitario === '' || it.precoUnitario === undefined || it.precoUnitario === null ? '' : numeroPedido_(it.precoUnitario);
    if (preco !== '' && preco < 0) return { sucesso: false, mensagem: 'Item ' + (i + 1) + ': preço não pode ser negativo.' };
    const s = saldos[pecaId] || { saldo: 0 };
    const p = params[pecaId] || { minimo: '' };
    itens.push({
      pecaId: pecaId, fornecedor: String(it.fornecedor || '').trim(), quantidade: quantidade, precoUnitario: preco,
      saldoNoMomento: s.saldo, estoqueMinimoNoMomento: p.minimo === '' ? '' : p.minimo,
      observacao: String(it.observacao || '').trim()
    });
  }
  if (!itens.length) return { sucesso: false, mensagem: 'Inclua pelo menos um produto no pedido.' };

  const valorTotal = Math.round(itens.reduce(function (s, it) { return s + (it.precoUnitario === '' ? 0 : it.precoUnitario * it.quantidade); }, 0) * 100) / 100;

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const abaPedidos = ss.getSheetByName(pedidosTableName);
  const pedidos = ReadPedidos();
  const hoje = hojePedido_();
  const dataTexto = Utilities.formatDate(data, 'GMT-3', 'dd/MM/yyyy');
  let pedidoId = Number(d.id) || 0;

  if (pedidoId) {
    const idx = pedidos.findIndex(function (l) { return Number(l[pedidoIdCol]) === pedidoId; });
    if (idx === -1) return { sucesso: false, mensagem: 'Pedido não encontrado.' };
    const linha = idx + firstLinePedidos;
    abaPedidos.getRange(linha, pedidoDataCol + 1, 1, 3).setValues([[dataTexto, status, observacao]]);
    abaPedidos.getRange(linha, pedidoValorTotalCol + 1).setValue(valorTotal);
    abaPedidos.getRange(linha, pedidoDtAlteracaoCol + 1).setValue(hoje);
  } else {
    const pos = proximoIdTabela(abaPedidos, firstLinePedidos);
    pedidoId = pos.novoId;
    abaPedidos.getRange(pos.proximaLinha, 1, 1, numColumnsPedidos).setValues([[
      pedidoId, dataTexto, status, observacao, nomeUsuarioLogado(), valorTotal, hoje, '', ''
    ]]);
  }

  // itens: os anteriores saem (exclusão lógica) e entram os atuais
  const abaItens = ss.getSheetByName(pedidoItensTableName);
  const todosItens = ReadPedidosItens();
  todosItens.forEach(function (l, i) {
    if (Number(l[pedidoItemPedidoIdCol]) === pedidoId && !String(l[pedidoItemDtExclusaoCol] || '').trim()) {
      abaItens.getRange(i + firstLinePedidoItens, pedidoItemDtExclusaoCol + 1).setValue(hoje);
    }
  });
  const pos2 = proximoIdTabela(abaItens, firstLinePedidoItens);
  abaItens.getRange(pos2.proximaLinha, 1, itens.length, numColumnsPedidoItens).setValues(itens.map(function (it, k) {
    return [pos2.novoId + k, pedidoId, it.pecaId, it.fornecedor, it.quantidade, it.precoUnitario,
      it.saldoNoMomento, it.estoqueMinimoNoMomento, it.observacao, ''];
  }));

  return { sucesso: true, mensagem: 'Pedido ' + (d.id ? 'atualizado' : 'criado') + ' com sucesso!', id: pedidoId };
}

/** Troca só o status (ação rápida na consulta: Enviar / Marcar como recebido / Cancelar). */
function atualizarStatusPedido(idInput, status) {
  try {
    return executarComLock(function () {
      const id = Number(idInput);
      if (!STATUS_PEDIDO[String(status)]) return { sucesso: false, mensagem: 'Status inválido.' };
      const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(pedidosTableName);
      const idx = aba ? ReadPedidos().findIndex(function (l) { return Number(l[pedidoIdCol]) === id; }) : -1;
      if (idx === -1) return { sucesso: false, mensagem: 'Pedido não encontrado.' };
      aba.getRange(idx + firstLinePedidos, pedidoStatusCol + 1).setValue(String(status));
      aba.getRange(idx + firstLinePedidos, pedidoDtAlteracaoCol + 1).setValue(hojePedido_());
      return { sucesso: true, mensagem: 'Pedido marcado como "' + STATUS_PEDIDO[String(status)] + '".' };
    });
  } catch (e) {
    return { sucesso: false, mensagem: 'Erro no servidor: ' + e.message };
  }
}

function alterarSituacaoPedido_(idInput, desativar) {
  try {
    return executarComLock(function () {
      const id = Number(idInput);
      const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(pedidosTableName);
      const idx = aba ? ReadPedidos().findIndex(function (l) { return Number(l[pedidoIdCol]) === id; }) : -1;
      if (idx === -1) return { sucesso: false, mensagem: 'Pedido não encontrado.' };
      aba.getRange(idx + firstLinePedidos, pedidoDtExclusaoCol + 1).setValue(desativar ? hojePedido_() : '');
      return { sucesso: true, mensagem: desativar ? 'Pedido excluído.' : 'Pedido reativado.' };
    });
  } catch (e) {
    return { sucesso: false, mensagem: 'Erro no servidor: ' + e.message };
  }
}

function excluirPedido(id) { return alterarSituacaoPedido_(id, true); }
function reativarPedido(id) { return alterarSituacaoPedido_(id, false); }
