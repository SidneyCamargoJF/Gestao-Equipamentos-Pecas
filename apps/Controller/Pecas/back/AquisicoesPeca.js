// =====================================================
// AQUISIÇÕES DA PEÇA / PRODUTO (tbl_pecas_aquisicoes)
// Lista, inclui (com o arquivo da nota) e exclui (lógico). A nota que já
// está no próprio cadastro do item (colunas NF / data / fornecedor) entra
// como uma aquisição a mais nas sugestões da garantia, sem arquivo.
// =====================================================

// Id do arquivo a partir da URL do Drive (/d/ID/ ou ?id=ID)
function idArquivoDrive_(url) {
  const s = String(url || '');
  const m = s.match(/\/d\/([A-Za-z0-9_-]+)/) || s.match(/[?&]id=([A-Za-z0-9_-]+)/);
  return m ? m[1] : '';
}

function objetoAquisicao_(l) {
  return {
    id: Number(l[aquisicaoIdCol]),
    pecaId: Number(l[aquisicaoPecaIdCol]),
    numeroNF: String(l[aquisicaoNumeroNFCol] || ''),
    fornecedor: String(l[aquisicaoFornecedorCol] || ''),
    dataAquisicao: String(l[aquisicaoDataCol] || ''),
    arquivoNome: String(l[aquisicaoArquivoNomeCol] || ''),
    arquivoUrl: String(l[aquisicaoArquivoUrlCol] || ''),
    temArquivo: String(l[aquisicaoArquivoIdCol] || '').trim() !== ''
  };
}

// mais recente primeiro (data; empate: id maior)
function ordenarAquisicoes_(lista) {
  const ts = function (a) { const d = parseDataFlex(a.dataAquisicao); return d ? d.getTime() : 0; };
  return lista.sort(function (a, b) { return (ts(b) - ts(a)) || (Number(b.id) || 0) - (Number(a.id) || 0); });
}

function aquisicoesAtivasPeca_(pecaId) {
  return ordenarAquisicoes_(ReadPecasAquisicoes()
    .filter(function (l) { return Number(l[aquisicaoPecaIdCol]) === Number(pecaId) && !String(l[aquisicaoDtExclusaoCol] || '').trim(); })
    .map(objetoAquisicao_));
}

function listarAquisicoesPeca(pecaId) {
  try {
    return { sucesso: true, aquisicoes: aquisicoesAtivasPeca_(pecaId) };
  } catch (e) {
    return { sucesso: false, mensagem: 'Erro no servidor: ' + e.message, aquisicoes: [] };
  }
}

/** dados: { pecaId, numeroNF, fornecedor, dataAquisicao, arquivo: { nome, tipo, base64 } } */
function salvarAquisicaoPeca(dados) {
  try {
    return executarComLock(function () {
      const d = dados || {};
      const pecaId = Number(d.pecaId);
      if (!pecaId || !ReadParts().some(function (l) { return Number(l[partsIdCol]) === pecaId; })) {
        return { sucesso: false, mensagem: 'Salve a peça/produto antes de incluir aquisições.' };
      }
      const numeroNF = String(d.numeroNF || '').trim();
      const fornecedor = String(d.fornecedor || '').trim();
      if (!numeroNF) return { sucesso: false, mensagem: 'Informe o número da nota.' };
      if (!fornecedor) return { sucesso: false, mensagem: 'Escolha o fornecedor.' };
      const data = parseDataFlex(d.dataAquisicao);
      if (!data) return { sucesso: false, mensagem: 'Informe a data de aquisição.' };

      criarAbaSeNaoExistir_(pecasAquisicoesTableName, CABECALHO_PECAS_AQUISICOES);
      let nomeArquivo = '', url = '', arquivoId = '';
      if (d.arquivo && d.arquivo.base64) {
        d.arquivo.nome = 'NF_' + numeroNF.replace(/[^\w.-]+/g, '_') + '_' + (d.arquivo.nome || 'nota');
        url = salvarArquivoAnexo(d.arquivo);
        nomeArquivo = d.arquivo.nome;
        arquivoId = idArquivoDrive_(url);
      }

      const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(pecasAquisicoesTableName);
      const pos = proximoIdTabela(aba, firstLinePecasAquisicoes);
      const hoje = Utilities.formatDate(new Date(), 'GMT-3', 'dd/MM/yyyy');
      aba.getRange(pos.proximaLinha, 1, 1, numColumnsPecasAquisicoes).setValues([[
        pos.novoId, pecaId, numeroNF, fornecedor, Utilities.formatDate(data, 'GMT-3', 'dd/MM/yyyy'),
        nomeArquivo, url, arquivoId, hoje, ''
      ]]);
      return { sucesso: true, mensagem: 'Aquisição incluída.', id: pos.novoId };
    });
  } catch (e) {
    return { sucesso: false, mensagem: 'Erro no servidor: ' + e.message };
  }
}

function excluirAquisicaoPeca(idInput) {
  try {
    return executarComLock(function () {
      const id = Number(idInput);
      const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(pecasAquisicoesTableName);
      const idx = aba ? ReadPecasAquisicoes().findIndex(function (l) { return Number(l[aquisicaoIdCol]) === id; }) : -1;
      if (idx === -1) return { sucesso: false, mensagem: 'Aquisição não encontrada.' };
      aba.getRange(idx + firstLinePecasAquisicoes, aquisicaoDtExclusaoCol + 1).setValue(Utilities.formatDate(new Date(), 'GMT-3', 'dd/MM/yyyy'));
      return { sucesso: true, mensagem: 'Aquisição excluída.' };
    });
  } catch (e) {
    return { sucesso: false, mensagem: 'Erro no servidor: ' + e.message };
  }
}

/**
 * Até 5 notas mais recentes do item para o e-mail da garantia: as
 * aquisições cadastradas mais a nota do próprio cadastro do item (sem
 * arquivo), se ela não estiver repetida numa aquisição.
 */
function aquisicoesParaGarantia_(pecaId) {
  const lista = aquisicoesAtivasPeca_(pecaId);
  const l = ReadParts().find(function (x) { return Number(x[partsIdCol]) === Number(pecaId); });
  const nfCadastro = l ? String(l[partsNumNFCol] || '').trim() : '';
  if (nfCadastro && !lista.some(function (a) { return a.numeroNF.trim().toLowerCase() === nfCadastro.toLowerCase(); })) {
    const dt = parseDataFlex(l[partsDtNFCol]);
    lista.push({
      id: 'cadastro', pecaId: Number(pecaId), numeroNF: nfCadastro, fornecedor: String(l[partsSuplierCol] || ''),
      dataAquisicao: dt ? Utilities.formatDate(dt, 'GMT-3', 'dd/MM/yyyy') : '', arquivoNome: '', arquivoUrl: '',
      temArquivo: false, doCadastro: true
    });
  }
  return ordenarAquisicoes_(lista).slice(0, 5);
}

/**
 * Busca de notas (com arquivo) em todos os itens, para anexar no e-mail.
 * termo: nome, modelo ou nº de série do item, nº da nota ou fornecedor.
 * Mais recentes primeiro, até 20.
 */
function buscarNotasPecas(termo) {
  try {
    const t = String(termo || '').trim().toLowerCase();
    if (t.length < 2) return { sucesso: true, notas: [] };
    const itens = {};
    ReadParts().forEach(function (l) {
      itens[Number(l[partsIdCol])] = { nome: String(l[partsNameCol] || ''), modelo: String(l[partsModelCol] || ''), ns: String(l[partsNSCol] || '') };
    });
    const notas = ReadPecasAquisicoes()
      .filter(function (l) { return !String(l[aquisicaoDtExclusaoCol] || '').trim() && String(l[aquisicaoArquivoIdCol] || '').trim(); })
      .map(function (l) {
        const a = objetoAquisicao_(l);
        const it = itens[a.pecaId] || { nome: '', modelo: '', ns: '' };
        a.item = it.nome; a.itemModelo = it.modelo; a.itemNumeroSerie = it.ns;
        return a;
      })
      .filter(function (a) {
        return [a.item, a.itemModelo, a.itemNumeroSerie, a.numeroNF, a.fornecedor].join(' ').toLowerCase().indexOf(t) !== -1;
      });
    return { sucesso: true, notas: ordenarAquisicoes_(notas).slice(0, 20) };
  } catch (e) {
    return { sucesso: false, mensagem: 'Erro no servidor: ' + e.message, notas: [] };
  }
}

/** Blob do arquivo da nota de uma aquisição (de qualquer item), ou erro. */
function blobAquisicao_(aquisicaoId) {
  const l = ReadPecasAquisicoes().find(function (x) { return Number(x[aquisicaoIdCol]) === Number(aquisicaoId); });
  if (!l || String(l[aquisicaoDtExclusaoCol] || '').trim()) {
    throw new Error('nota fiscal (aquisição ' + aquisicaoId + ') não encontrada.');
  }
  const idArq = String(l[aquisicaoArquivoIdCol] || '').trim();
  if (!idArq) throw new Error('a nota ' + l[aquisicaoNumeroNFCol] + ' não tem arquivo.');
  return DriveApp.getFileById(idArq).getBlob().setName(String(l[aquisicaoArquivoNomeCol] || ('NF_' + l[aquisicaoNumeroNFCol])));
}
