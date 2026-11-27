// =====================================================
// ESTOQUE -- saldo por peça/produto e movimentações
// - Entradas das notas fiscais (Compras): cada item relacionado ao cadastro
//   entra com a quantidade da nota; alterar/desativar a nota refaz as
//   entradas dela (sincronizarEntradasNota_).
// - Entradas manuais (sem nota), saídas (para um chamado, um equipamento ou
//   outro destino) e ajustes de inventário (contagem), com estorno.
// - Saída não deixa o saldo negativo. Estoque mínimo e unidade por item.
// =====================================================

const TIPOS_MOV_ESTOQUE = { entrada: 'Entrada', saida: 'Saída', ajuste: 'Ajuste de inventário' };
const ORIGENS_MOV_ESTOQUE = { nota_fiscal: 'Nota fiscal', manual: 'Manual', chamado: 'Chamado', equipamento: 'Equipamento' };

function garantirAbasEstoque_() {
  return [
    criarAbaSeNaoExistir_(estoqueMovTableName, CABECALHO_ESTOQUE_MOV),
    criarAbaSeNaoExistir_(estoqueParamTableName, CABECALHO_ESTOQUE_PARAM)
  ];
}

function hojeEstoque_() { return Utilities.formatDate(new Date(), 'GMT-3', 'dd/MM/yyyy'); }

// quantidade com até 4 casas (aceita "1,5")
function qtdEstoque_(v) {
  if (v === '' || v === null || v === undefined) return NaN;
  const n = typeof v === 'number' ? v : Number(String(v).trim().replace(/\./g, function (m, i, s) { return /,/.test(s) ? '' : m; }).replace(',', '.'));
  return isFinite(n) ? Math.round(n * 10000) / 10000 : NaN;
}

function movimentosAtivos_() {
  return ReadEstoqueMovimentos().filter(function (l) {
    return String(l[movIdCol] || '').trim() !== '' && !String(l[movDtExclusaoCol] || '').trim();
  });
}

// quantidade com sinal: saída negativa
function efeitoMov_(l) {
  const q = Number(l[movQuantidadeCol]) || 0;
  return String(l[movTipoCol]) === 'saida' ? -Math.abs(q) : (String(l[movTipoCol]) === 'entrada' ? Math.abs(q) : q);
}

/** { pecaId: { saldo, ultimaData, ultimaTs } } */
function saldosEstoque_(movs) {
  const mapa = {};
  (movs || movimentosAtivos_()).forEach(function (l) {
    const id = Number(l[movPecaIdCol]);
    if (!mapa[id]) mapa[id] = { saldo: 0, ultimaData: '', ultimaTs: 0 };
    mapa[id].saldo = Math.round((mapa[id].saldo + efeitoMov_(l)) * 10000) / 10000;
    const d = parseDataFlex(l[movDataCol]);
    if (d && d.getTime() >= mapa[id].ultimaTs) { mapa[id].ultimaTs = d.getTime(); mapa[id].ultimaData = String(l[movDataCol]); }
  });
  return mapa;
}

function parametrosEstoque_() {
  const mapa = {};
  ReadEstoqueParametros().forEach(function (l, i) {
    mapa[Number(l[paramPecaIdCol])] = {
      linha: i + firstLineEstoqueParam,
      minimo: l[paramMinimoCol] === '' ? '' : Number(l[paramMinimoCol]),
      unidade: String(l[paramUnidadeCol] || '')
    };
  });
  return mapa;
}

// 'zerado' e 'abaixo' (igual ou abaixo do mínimo) são críticos (vermelho);
// 'alerta' é só aviso -- até 5 unidades acima do mínimo, "vai acabar" (amarelo).
function situacaoEstoque_(saldo, minimo) {
  if (saldo <= 0) return 'zerado';
  if (minimo !== '' && minimo !== undefined) {
    const m = Number(minimo);
    if (saldo <= m) return 'abaixo';
    if (saldo <= m + 5) return 'alerta';
  }
  return 'ok';
}

// ===== CONSULTA DO SALDO =====

/**
 * filtros: { texto, tipo ('peca'|'produto'), situacao ('com_saldo' |
 * 'abaixo' | 'zerado' | 'movimentados' | '' todos) }
 */
function listarEstoque(filtros) {
  try {
    const f = filtros || {};
    const texto = String(f.texto || '').trim().toLowerCase();
    const saldos = saldosEstoque_();
    const params = parametrosEstoque_();
    const lista = ReadParts()
      .filter(function (l) { return String(l[partsIdCol] || '').trim() !== '' && !String(l[partsDtExclusaoCol] || '').trim(); })
      .map(function (l) {
        const id = Number(l[partsIdCol]);
        const s = saldos[id] || { saldo: 0, ultimaData: '' };
        const p = params[id] || { minimo: '', unidade: '' };
        return {
          id: id, nome: String(l[partsNameCol] || ''), tipo: tipoItemEstoque_(l[partsTipoCol]), marca: String(l[partsBrandCol] || ''),
          modelo: String(l[partsModelCol] || ''), numeroSerie: String(l[partsNSCol] || ''), localizacao: String(l[partsLocalCol] || ''),
          saldo: s.saldo, ultimaMovimentacao: s.ultimaData, movimentado: !!saldos[id],
          minimo: p.minimo, unidade: p.unidade || 'UN', situacao: situacaoEstoque_(s.saldo, p.minimo)
        };
      })
      .filter(function (it) {
        if (f.tipo && it.tipo !== f.tipo) return false;
        if (f.situacao === 'com_saldo' && it.saldo <= 0) return false;
        if (f.situacao === 'abaixo' && it.situacao !== 'abaixo') return false;
        if (f.situacao === 'zerado' && !(it.situacao === 'zerado' && (it.movimentado || it.minimo !== ''))) return false;
        if (f.situacao === 'alerta' && it.situacao !== 'alerta') return false;
        if (f.situacao === 'movimentados' && !it.movimentado) return false;
        if (texto && [it.nome, it.marca, it.modelo, it.numeroSerie, it.localizacao].join(' ').toLowerCase().indexOf(texto) === -1) return false;
        return true;
      })
      .sort(function (a, b) {
        // críticos (zerado/abaixo) no topo, depois alerta, depois ok, depois sem controle nenhum
        const peso = { zerado: 0, abaixo: 0, alerta: 1, ok: 2 };
        const pa = a.movimentado || a.minimo !== '' ? peso[a.situacao] : 3, pb = b.movimentado || b.minimo !== '' ? peso[b.situacao] : 3;
        return (pa - pb) || a.nome.localeCompare(b.nome, 'pt-BR');
      });
    const controlados = lista.filter(function (i) { return i.movimentado || i.minimo !== ''; });
    return {
      sucesso: true, itens: lista,
      resumo: {
        comSaldo: lista.filter(function (i) { return i.saldo > 0; }).length,
        abaixo: lista.filter(function (i) { return i.situacao === 'abaixo'; }).length,
        zerados: controlados.filter(function (i) { return i.situacao === 'zerado'; }).length,
        alerta: lista.filter(function (i) { return i.situacao === 'alerta'; }).length
      }
    };
  } catch (e) {
    return { sucesso: false, mensagem: 'Erro no servidor: ' + e.message, itens: [] };
  }
}

/** Movimentações. filtros: { pecaId, tipo, origem, de, ate, texto, incluirEstornados } */
function listarMovimentosEstoque(filtros) {
  try {
    const f = filtros || {};
    const de = parseDataFlex(f.de), ate = parseDataFlex(f.ate);
    const texto = String(f.texto || '').trim().toLowerCase();
    const pecas = {};
    ReadParts().forEach(function (l) { pecas[Number(l[partsIdCol])] = String(l[partsNameCol] || ''); });
    const params = parametrosEstoque_();
    const lista = ReadEstoqueMovimentos()
      .filter(function (l) { return String(l[movIdCol] || '').trim() !== ''; })
      .map(function (l) {
        const pecaId = Number(l[movPecaIdCol]);
        return {
          id: Number(l[movIdCol]), pecaId: pecaId, item: pecas[pecaId] || ('item ' + pecaId), tipo: String(l[movTipoCol]),
          tipoTexto: TIPOS_MOV_ESTOQUE[String(l[movTipoCol])] || String(l[movTipoCol]),
          quantidade: Number(l[movQuantidadeCol]) || 0, efeito: efeitoMov_(l), data: String(l[movDataCol] || ''),
          origem: String(l[movOrigemCol] || ''), origemTexto: ORIGENS_MOV_ESTOQUE[String(l[movOrigemCol])] || '',
          origemId: l[movOrigemIdCol], documento: String(l[movDocumentoCol] || ''), valorUnitario: l[movValorUnitCol],
          observacao: String(l[movObservacaoCol] || ''), usuario: String(l[movUsuarioCol] || ''),
          unidade: (params[pecaId] && params[pecaId].unidade) || 'UN',
          estornado: String(l[movDtExclusaoCol] || '').trim() !== '',
          podeEstornar: String(l[movOrigemCol]) !== 'nota_fiscal' && !String(l[movDtExclusaoCol] || '').trim()
        };
      })
      .filter(function (m) {
        if (!f.incluirEstornados && m.estornado) return false;
        if (f.pecaId && m.pecaId !== Number(f.pecaId)) return false;
        if (f.tipo && m.tipo !== f.tipo) return false;
        if (f.origem && m.origem !== f.origem) return false;
        const d = parseDataFlex(m.data);
        if (de && (!d || d < de)) return false;
        if (ate && (!d || d > ate)) return false;
        if (texto && [m.item, m.documento, m.observacao, m.usuario].join(' ').toLowerCase().indexOf(texto) === -1) return false;
        return true;
      })
      .sort(function (a, b) {
        const da = parseDataFlex(a.data), db = parseDataFlex(b.data);
        return ((db ? db.getTime() : 0) - (da ? da.getTime() : 0)) || b.id - a.id;
      });
    return { sucesso: true, movimentos: lista };
  } catch (e) {
    return { sucesso: false, mensagem: 'Erro no servidor: ' + e.message, movimentos: [] };
  }
}

// ===== MOVIMENTAÇÃO MANUAL =====

function gravarMovimento_(pecaId, tipo, quantidade, data, origem, origemId, documento, valorUnitario, observacao) {
  const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(estoqueMovTableName);
  const pos = proximoIdTabela(aba, firstLineEstoqueMov);
  aba.getRange(pos.proximaLinha, 1, 1, numColumnsEstoqueMov).setValues([[
    pos.novoId, Number(pecaId), tipo, quantidade, data, origem, origemId === undefined ? '' : origemId, documento || '',
    valorUnitario === undefined ? '' : valorUnitario, observacao || '', nomeUsuarioLogado(), hojeEstoque_(), ''
  ]]);
  return pos.novoId;
}

/**
 * dados: { tipo ('entrada'|'saida'|'ajuste'), pecaId, quantidade (entrada/
 * saída), novaQuantidade (ajuste: o que foi contado), data, valorUnitario,
 * chamadoId, patrimonio, observacao }
 */
function registrarMovimentoEstoque(dados) {
  try {
    return executarComLock(function () {
      garantirAbasEstoque_();
      const d = dados || {};
      const tipo = String(d.tipo || '');
      if (!TIPOS_MOV_ESTOQUE[tipo]) return { sucesso: false, mensagem: 'Escolha o tipo da movimentação.' };
      const pecaId = Number(d.pecaId);
      const peca = ReadParts().find(function (l) { return Number(l[partsIdCol]) === pecaId; });
      if (!peca) return { sucesso: false, mensagem: 'Escolha a peça/produto.' };
      if (String(peca[partsDtExclusaoCol] || '').trim()) return { sucesso: false, mensagem: 'Este item está desativado.' };
      const dt = d.data ? parseDataFlex(d.data) : new Date();
      if (!dt) return { sucesso: false, mensagem: 'Data inválida.' };
      const data = Utilities.formatDate(dt, 'GMT-3', 'dd/MM/yyyy');
      const observacao = String(d.observacao || '').trim();
      const nome = String(peca[partsNameCol] || '');
      const saldo = (saldosEstoque_()[pecaId] || { saldo: 0 }).saldo;

      if (tipo === 'ajuste') {
        const contado = qtdEstoque_(d.novaQuantidade);
        if (isNaN(contado) || contado < 0) return { sucesso: false, mensagem: 'Informe a quantidade contada (zero ou mais).' };
        if (!observacao) return { sucesso: false, mensagem: 'Informe o motivo do ajuste.' };
        const diferenca = Math.round((contado - saldo) * 10000) / 10000;
        if (diferenca === 0) return { sucesso: false, mensagem: 'A quantidade contada é igual ao saldo (' + saldo + '). Nada a ajustar.' };
        gravarMovimento_(pecaId, 'ajuste', diferenca, data, 'manual', '', 'Inventário', '', observacao);
        return { sucesso: true, mensagem: 'Ajuste registrado: ' + nome + ' passou de ' + saldo + ' para ' + contado + '.', saldo: contado };
      }

      const qtd = qtdEstoque_(d.quantidade);
      if (isNaN(qtd) || qtd <= 0) return { sucesso: false, mensagem: 'Informe uma quantidade maior que zero.' };

      if (tipo === 'entrada') {
        if (!observacao) return { sucesso: false, mensagem: 'Informe a origem da entrada (as compras com nota entram por Compras > Notas fiscais).' };
        const valor = d.valorUnitario === '' || d.valorUnitario === undefined ? '' : qtdEstoque_(d.valorUnitario);
        gravarMovimento_(pecaId, 'entrada', qtd, data, 'manual', '', 'Entrada manual', isNaN(valor) ? '' : valor, observacao);
        return { sucesso: true, mensagem: 'Entrada registrada: ' + qtd + ' × ' + nome + '. Saldo: ' + (Math.round((saldo + qtd) * 10000) / 10000) + '.', saldo: saldo + qtd };
      }

      // saída: destino (chamado, equipamento ou observação) e saldo suficiente
      if (qtd > saldo) return { sucesso: false, mensagem: 'Saldo insuficiente de ' + nome + ': há ' + saldo + ' e a saída é de ' + qtd + '.' };
      let origem = 'manual', origemId = '', documento = '';
      const chamadoId = Number(d.chamadoId) || 0;
      const patrimonio = String(d.patrimonio || '').trim();
      if (chamadoId) {
        if (!ReadTickets().some(function (l) { return Number(l[0]) === chamadoId; })) return { sucesso: false, mensagem: 'Chamado nº ' + chamadoId + ' não encontrado.' };
        origem = 'chamado'; origemId = chamadoId; documento = 'Chamado #' + chamadoId;
      }
      if (patrimonio) {
        const eq = ReadEquipments().find(function (e) { return String(e[5] || '').trim().toLowerCase() === patrimonio.toLowerCase(); });
        if (!eq) return { sucesso: false, mensagem: 'Patrimônio ' + patrimonio + ' não encontrado no cadastro de equipamentos.' };
        documento = (documento ? documento + ' · ' : '') + 'Patrimônio ' + patrimonio;
        if (!chamadoId) { origem = 'equipamento'; origemId = Number(eq[0]); }
      }
      if (!chamadoId && !patrimonio && !observacao) return { sucesso: false, mensagem: 'Informe o destino da saída: chamado, patrimônio do equipamento ou observação.' };
      gravarMovimento_(pecaId, 'saida', qtd, data, origem, origemId, documento || 'Saída manual', '', observacao);
      if (chamadoId) {
        adicionarHistoricoSistema(chamadoId, 'Saída de estoque: ' + qtd + ' × ' + nome + (patrimonio ? ' (patrimônio ' + patrimonio + ')' : '') + (observacao ? '. ' + observacao : ''));
      }
      return { sucesso: true, mensagem: 'Saída registrada: ' + qtd + ' × ' + nome + '. Saldo: ' + (Math.round((saldo - qtd) * 10000) / 10000) + '.', saldo: saldo - qtd };
    });
  } catch (e) {
    return { sucesso: false, mensagem: 'Erro no servidor: ' + e.message };
  }
}

/** Estorno (exclusão lógica) de uma movimentação que não veio de nota fiscal. */
function estornarMovimentoEstoque(idInput, motivo) {
  try {
    return executarComLock(function () {
      const id = Number(idInput);
      const m = String(motivo || '').trim();
      if (!m) return { sucesso: false, mensagem: 'Informe o motivo do estorno.' };
      const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(estoqueMovTableName);
      const movs = ReadEstoqueMovimentos();
      const idx = aba ? movs.findIndex(function (l) { return Number(l[movIdCol]) === id; }) : -1;
      if (idx === -1) return { sucesso: false, mensagem: 'Movimentação não encontrada.' };
      const l = movs[idx];
      if (String(l[movDtExclusaoCol] || '').trim()) return { sucesso: false, mensagem: 'Esta movimentação já foi estornada.' };
      if (String(l[movOrigemCol]) === 'nota_fiscal') return { sucesso: false, mensagem: 'Entrada de nota fiscal: altere ou desative a nota em Compras > Notas fiscais.' };
      // estornar uma entrada/ajuste positivo não pode deixar o saldo negativo
      const saldo = (saldosEstoque_()[Number(l[movPecaIdCol])] || { saldo: 0 }).saldo;
      if (saldo - efeitoMov_(l) < 0) return { sucesso: false, mensagem: 'O estorno deixaria o saldo negativo (saldo atual ' + saldo + ').' };
      const linha = idx + firstLineEstoqueMov;
      aba.getRange(linha, movDtExclusaoCol + 1).setValue(hojeEstoque_());
      aba.getRange(linha, movObservacaoCol + 1).setValue(String(l[movObservacaoCol] || '') + ' [Estornado por ' + nomeUsuarioLogado() + ': ' + m + ']');
      if (String(l[movOrigemCol]) === 'chamado' && Number(l[movOrigemIdCol])) {
        adicionarHistoricoSistema(Number(l[movOrigemIdCol]), 'Saída de estoque estornada (' + l[movQuantidadeCol] + ' item(ns)). Motivo: ' + m);
      }
      return { sucesso: true, mensagem: 'Movimentação estornada.' };
    });
  } catch (e) {
    return { sucesso: false, mensagem: 'Erro no servidor: ' + e.message };
  }
}

/** dados: { pecaId, estoqueMinimo ('' = sem mínimo), unidade } */
function salvarParametrosEstoque(dados) {
  try {
    return executarComLock(function () {
      garantirAbasEstoque_();
      const d = dados || {};
      const pecaId = Number(d.pecaId);
      if (!pecaId || !ReadParts().some(function (l) { return Number(l[partsIdCol]) === pecaId; })) return { sucesso: false, mensagem: 'Item não encontrado.' };
      let minimo = '';
      if (String(d.estoqueMinimo === undefined || d.estoqueMinimo === null ? '' : d.estoqueMinimo).trim() !== '') {
        minimo = qtdEstoque_(d.estoqueMinimo);
        if (isNaN(minimo) || minimo < 0) return { sucesso: false, mensagem: 'Estoque mínimo inválido.' };
      }
      const unidade = String(d.unidade || '').trim().toUpperCase() || 'UN';
      const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(estoqueParamTableName);
      const p = parametrosEstoque_()[pecaId];
      if (p) {
        aba.getRange(p.linha, paramMinimoCol + 1, 1, 3).setValues([[minimo, unidade, hojeEstoque_()]]);
      } else {
        const pos = proximoIdTabela(aba, firstLineEstoqueParam);
        aba.getRange(pos.proximaLinha, 1, 1, numColumnsEstoqueParam).setValues([[pos.novoId, pecaId, minimo, unidade, hojeEstoque_()]]);
      }
      return { sucesso: true, mensagem: 'Estoque mínimo e unidade gravados.' };
    });
  } catch (e) {
    return { sucesso: false, mensagem: 'Erro no servidor: ' + e.message };
  }
}

// ===== ENTRADAS DAS NOTAS FISCAIS =====

/**
 * Refaz as entradas de uma nota: as anteriores dela saem (exclusão lógica)
 * e cada item relacionado entra com a quantidade da nota (nota ativa).
 * Sem lock próprio (chamado de dentro do salvar/desativar da nota).
 */
function sincronizarEntradasNota_(nfId) {
  garantirAbasEstoque_();
  const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(estoqueMovTableName);
  const nota = ReadNotasFiscais().find(function (l) { return Number(l[nfIdCol]) === Number(nfId); });
  const hoje = hojeEstoque_();
  ReadEstoqueMovimentos().forEach(function (l, i) {
    if (String(l[movOrigemCol]) === 'nota_fiscal' && Number(l[movOrigemIdCol]) === Number(nfId) && !String(l[movDtExclusaoCol] || '').trim()) {
      aba.getRange(i + firstLineEstoqueMov, movDtExclusaoCol + 1).setValue(hoje);
    }
  });
  if (!nota || String(nota[nfDtExclusaoCol] || '').trim()) return 0;
  const linhas = itensAtivosNota_(nfId)
    .filter(function (i) { return Number(i[nfItemPecaIdCol]) && Number(i[nfItemQuantidadeCol]) > 0; })
    .map(function (i) {
      return [Number(i[nfItemPecaIdCol]), 'entrada', Number(i[nfItemQuantidadeCol]), String(nota[nfDataEmissaoCol] || hoje), 'nota_fiscal',
        Number(nfId), 'NF ' + nota[nfNumeroCol] + (nota[nfSerieCol] ? '/' + nota[nfSerieCol] : '') + ' — ' + nota[nfFornecedorCol],
        i[nfItemValorUnitCol], String(i[nfItemDescricaoCol] || '')];
    });
  if (!linhas.length) return 0;
  const pos = proximoIdTabela(aba, firstLineEstoqueMov);
  const usuario = nomeUsuarioLogado();
  aba.getRange(pos.proximaLinha, 1, linhas.length, numColumnsEstoqueMov).setValues(linhas.map(function (v, k) {
    return [pos.novoId + k].concat(v).concat([usuario, hoje, '']);
  }));
  return linhas.length;
}

/** Botão "Atualizar entradas das notas": refaz as entradas de todas as notas. */
function sincronizarEntradasTodasNotas() {
  try {
    return executarComLock(function () {
      let notas = 0, itens = 0;
      ReadNotasFiscais().forEach(function (l) {
        if (!String(l[nfIdCol] || '').trim()) return;
        notas++;
        itens += sincronizarEntradasNota_(Number(l[nfIdCol]));
      });
      return { sucesso: true, mensagem: notas + ' nota(s) conferida(s); ' + itens + ' entrada(s) de itens relacionados no estoque.' };
    });
  } catch (e) {
    return { sucesso: false, mensagem: 'Erro no servidor: ' + e.message };
  }
}

// ===== DASHBOARD =====
function indicadoresEstoque_() {
  const r = listarEstoque({});
  return { abaixo: (r.resumo || {}).abaixo || 0, zerados: (r.resumo || {}).zerados || 0, comSaldo: (r.resumo || {}).comSaldo || 0 };
}
