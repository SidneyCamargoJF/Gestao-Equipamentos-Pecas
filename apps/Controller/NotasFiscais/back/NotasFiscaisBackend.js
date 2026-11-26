// =====================================================
// NOTAS FISCAIS (Compras > Notas fiscais) e PRODUTO x FORNECEDOR
// - Cabeçalho, itens e anexos (nota escaneada, XML) da nota.
// - Garantia "geral" (vale para todos os itens) ou "por produto"; item
//   sem garantia própria usa a geral, e sem nenhuma das duas a nota não
//   é salva (o sistema pede a garantia).
// - Cada item pode ser relacionado a uma peça/produto do cadastro. A
//   relação fica em tbl_produto_fornecedor (fornecedor + código do item na
//   nota -> peça), usada para relacionar sozinho o próximo XML.
// - Item relacionado vira uma aquisição da peça (tbl_pecas_aquisicoes,
//   coluna NF_ID), com o arquivo da nota escaneada -- aparece no cadastro
//   do item e é sugerida no e-mail de garantia. Se a peça não tiver
//   garantia/nota cadastradas, recebe as da nota.
// =====================================================

const TIPOS_ANEXO_NOTA = ['Nota escaneada', 'XML', 'Outro'];

function garantirAbasNotasFiscais_() {
  const r = [
    criarAbaSeNaoExistir_(notasFiscaisTableName, CABECALHO_NOTAS_FISCAIS),
    criarAbaSeNaoExistir_(nfItensTableName, CABECALHO_NF_ITENS),
    criarAbaSeNaoExistir_(nfAnexosTableName, CABECALHO_NF_ANEXOS),
    criarAbaSeNaoExistir_(produtoFornecedorTableName, CABECALHO_PRODUTO_FORNECEDOR),
    criarAbaSeNaoExistir_(pecasAquisicoesTableName, CABECALHO_PECAS_AQUISICOES)
  ];
  // aba de aquisições antiga: cabeçalho da coluna nova NF_ID
  const abaAq = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(pecasAquisicoesTableName);
  if (abaAq && String(abaAq.getRange(firstLinePecasAquisicoes - 1, aquisicaoNfIdCol + 1).getValue() || '').trim() === '') {
    abaAq.getRange(firstLinePecasAquisicoes - 1, aquisicaoNfIdCol + 1).setValue('NF_ID');
  }
  return r;
}

function soDigitosNF_(s) { return String(s || '').replace(/\D/g, ''); }
function hojeNF_() { return Utilities.formatDate(new Date(), 'GMT-3', 'dd/MM/yyyy'); }
function dataBRNF_(d) { return Utilities.formatDate(d, 'GMT-3', 'dd/MM/yyyy'); }

function somarMesesNF_(data, meses) {
  const d = new Date(data.getFullYear(), data.getMonth() + Number(meses), data.getDate());
  // 31/01 + 1 mês: fica no último dia do mês, não pula para março
  if (d.getDate() !== data.getDate()) d.setDate(0);
  return d;
}

// meses: '' ou inteiro >= 0 (null se inválido)
function mesesNF_(v) {
  const s = String(v === undefined || v === null ? '' : v).trim();
  if (s === '') return '';
  const n = Number(s.replace(',', '.'));
  return (isFinite(n) && n >= 0 && Math.floor(n) === n) ? n : null;
}

function numeroNF_(v) {
  if (v === undefined || v === null || String(v).trim() === '') return '';
  if (typeof v === 'number') return v;
  const s = String(v).trim();
  const n = Number(/,\d{1,}$/.test(s) ? s.replace(/\./g, '').replace(',', '.') : s);
  return isFinite(n) ? n : '';
}

/** Data final da garantia: a informada ou emissão + meses ('' se nenhuma). */
function garantiaAteNF_(emissao, meses, ate) {
  if (ate) return ate;
  if (meses !== '' && meses !== null && emissao) return dataBRNF_(somarMesesNF_(emissao, meses));
  return '';
}

// ===== FORNECEDORES E ITENS DO ESTOQUE =====

/** Fornecedores ativos para o campo da nota: [{ nome, fantasia, cnpj }] */
function listarFornecedoresNF() {
  return ReadSuppliers()
    .filter(function (l) { return String(l[supplierStatusCol - 1] || '').trim().toLowerCase() !== 'inativo'; })
    .map(function (l) {
      return {
        nome: String(l[supplierRazaoSocialCol - 1] || l[supplierNameCol - 1] || '').trim(),
        fantasia: String(l[supplierNameCol - 1] || '').trim(),
        cnpj: soDigitosNF_(l[supplierCNPJCol - 1])
      };
    })
    .filter(function (f) { return f.nome; })
    .sort(function (a, b) { return a.nome.localeCompare(b.nome, 'pt-BR'); });
}

function formatarCnpjNF_(c) {
  const d = soDigitosNF_(c);
  return d.length === 14 ? d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5') : d;
}

/**
 * Inclui no cadastro o fornecedor da nota que ainda não existe (pelo CNPJ;
 * sem CNPJ, pelo nome). Vem do XML (com endereço) ou do nome digitado na
 * nota -- sempre depois da confirmação do usuário. Marca como distribuidor
 * de produtos. dados: { razaoSocial, nomeFantasia, cnpj, inscricaoEstadual,
 * email, telefone, cep, logradouro, numero, complemento, bairro, cidade, uf }
 */
function criarFornecedorDaNota(dados) {
  try {
    return executarComLock(function () {
      const d = dados || {};
      const razao = String(d.razaoSocial || '').trim();
      const cnpj = soDigitosNF_(d.cnpj);
      if (!razao) return { sucesso: false, mensagem: 'Informe o nome (razão social) do fornecedor.' };
      if (cnpj && cnpj.length !== 14 && cnpj.length !== 11) return { sucesso: false, mensagem: 'CNPJ do fornecedor inválido.' };
      const existente = listarFornecedoresNF().find(function (f) {
        return cnpj ? f.cnpj === cnpj : f.nome.toLowerCase() === razao.toLowerCase();
      });
      if (existente) return { sucesso: true, mensagem: 'Fornecedor já cadastrado.', fornecedor: existente, jaExistia: true };

      const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(supplierTableName);
      if (!aba) return { sucesso: false, mensagem: "Aba '" + supplierTableName + "' não foi encontrada." };
      const pos = proximoIdTabela(aba, firstLineSupplier);
      const t = function (v) { return String(v === undefined || v === null ? '' : v).trim(); };
      // [id, prestador, distribuidor, razão social, fantasia, cnpj, IE, IM, e-mail,
      //  telefone, celular, whatsapp, cep, logradouro, número, bairro, cidade, UF,
      //  complemento, data de cadastro, data de alteração, status]
      aba.getRange(pos.proximaLinha, 1, 1, numColumnsupplier).setValues([[
        pos.novoId, '', 'Sim', razao, t(d.nomeFantasia) || razao, formatarCnpjNF_(cnpj), t(d.inscricaoEstadual), '', t(d.email),
        t(d.telefone), '', '', soDigitosNF_(d.cep), t(d.logradouro), t(d.numero), t(d.bairro), t(d.cidade), t(d.uf),
        t(d.complemento), hojeNF_(), '', 'Ativo'
      ]]);
      return {
        sucesso: true, mensagem: 'Fornecedor ' + razao + ' incluído no cadastro.',
        fornecedor: { nome: razao, fantasia: t(d.nomeFantasia), cnpj: cnpj }
      };
    });
  } catch (e) {
    return { sucesso: false, mensagem: 'Erro no servidor: ' + e.message };
  }
}

function mapaPecasNF_() {
  const mapa = {};
  ReadParts().forEach(function (l) {
    mapa[Number(l[partsIdCol])] = {
      id: Number(l[partsIdCol]), nome: String(l[partsNameCol] || ''), modelo: String(l[partsModelCol] || ''),
      tipo: tipoItemEstoque_(l[partsTipoCol]), desativada: String(l[partsDtExclusaoCol] || '').trim() !== ''
    };
  });
  return mapa;
}

/**
 * Cria a peça/produto a partir de um item da nota (botão "Cadastrar novo").
 * dados: { nome, tipo, modelo, fornecedor, numeroNF, dataNF }
 */
function criarItemEstoqueDaNota(dados) {
  try {
    const d = dados || {};
    const nome = String(d.nome || '').trim();
    if (!nome) return { sucesso: false, mensagem: 'Informe o nome do item.' };
    const dataNF = parseDataFlex(d.dataNF);
    const r = salvarPeca({
      nome: nome, tipo: tipoItemEstoque_(d.tipo), modelo: String(d.modelo || '').trim(), marca: '', capacidade: '', numero_serie: '',
      local: '', fornecedor: String(d.fornecedor || '').trim(), notaFiscal: String(d.numeroNF || '').trim(),
      dataNotaFiscal: dataNF ? Utilities.formatDate(dataNF, 'GMT-3', 'yyyy-MM-dd') : '', garantia: '', dtGarantia: '',
      modalidade: 'compra', valor: '', seiNum: ''
    });
    if (!r || !r.sucesso) return r || { sucesso: false, mensagem: 'Não foi possível cadastrar o item.' };
    return { sucesso: true, mensagem: r.mensagem, item: { id: Number(r.id), nome: nome, tipo: tipoItemEstoque_(d.tipo) } };
  } catch (e) {
    return { sucesso: false, mensagem: 'Erro no servidor: ' + e.message };
  }
}

// ===== PRODUTO x FORNECEDOR =====

function mesmoFornecedorNF_(cnpjA, nomeA, cnpjB, nomeB) {
  const a = soDigitosNF_(cnpjA), b = soDigitosNF_(cnpjB);
  if (a && b) return a === b;
  return String(nomeA || '').trim().toLowerCase() === String(nomeB || '').trim().toLowerCase();
}

/** Relações ativas do fornecedor para um código (ou null). */
function relacaoProdutoFornecedor_(rels, cnpj, fornecedor, codigo) {
  const c = String(codigo || '').trim().toLowerCase();
  if (!c) return null;
  return rels.find(function (l) {
    return !String(l[pfDtExclusaoCol] || '').trim() && String(l[pfCodigoCol] || '').trim().toLowerCase() === c &&
      mesmoFornecedorNF_(l[pfFornecedorCnpjCol], l[pfFornecedorCol], cnpj, fornecedor);
  }) || null;
}

/**
 * Grava (ou atualiza) a relação fornecedor + código -> peça. Sem lock
 * próprio: chamar dentro de executarComLock.
 */
function gravarRelacaoProdutoFornecedor_(pecaId, fornecedor, cnpj, codigo, descricao) {
  if (!pecaId || !String(codigo || '').trim()) return false;
  const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(produtoFornecedorTableName);
  const rels = ReadProdutoFornecedor();
  const atual = relacaoProdutoFornecedor_(rels, cnpj, fornecedor, codigo);
  if (atual) {
    if (Number(atual[pfPecaIdCol]) === Number(pecaId)) return false;
    const linha = rels.indexOf(atual) + firstLineProdutoFornecedor;
    aba.getRange(linha, pfPecaIdCol + 1).setValue(Number(pecaId));
    aba.getRange(linha, pfDescricaoCol + 1).setValue(String(descricao || ''));
    return true;
  }
  const pos = proximoIdTabela(aba, firstLineProdutoFornecedor);
  aba.getRange(pos.proximaLinha, 1, 1, numColumnsProdutoFornecedor).setValues([[
    pos.novoId, Number(pecaId), String(fornecedor || '').trim(), soDigitosNF_(cnpj), String(codigo).trim(),
    String(descricao || '').trim(), hojeNF_(), ''
  ]]);
  return true;
}

/**
 * Para os itens importados do XML: a peça relacionada pelo fornecedor e o
 * código do item. itens: [{ codigo }] -> [{ indice, pecaId, pecaNome, pecaTipo }]
 */
function relacionarItensNotaFiscal(cnpj, fornecedor, itens) {
  try {
    const rels = ReadProdutoFornecedor();
    const pecas = mapaPecasNF_();
    const relacoes = (itens || []).map(function (it, i) {
      const r = relacaoProdutoFornecedor_(rels, cnpj, fornecedor, it && it.codigo);
      const p = r ? pecas[Number(r[pfPecaIdCol])] : null;
      return p && !p.desativada ? { indice: i, pecaId: p.id, pecaNome: p.nome, pecaTipo: p.tipo } : { indice: i, pecaId: null };
    });
    return { sucesso: true, relacoes: relacoes };
  } catch (e) {
    return { sucesso: false, mensagem: 'Erro no servidor: ' + e.message, relacoes: [] };
  }
}

function listarProdutoFornecedor(filtros) {
  try {
    const texto = String((filtros && filtros.texto) || '').trim().toLowerCase();
    const pecas = mapaPecasNF_();
    const lista = ReadProdutoFornecedor()
      .filter(function (l) { return String(l[pfIdCol] || '').trim() !== '' && !String(l[pfDtExclusaoCol] || '').trim(); })
      .map(function (l) {
        const p = pecas[Number(l[pfPecaIdCol])] || {};
        return {
          id: Number(l[pfIdCol]), pecaId: Number(l[pfPecaIdCol]), pecaNome: p.nome || '(item ' + l[pfPecaIdCol] + ')',
          pecaTipo: p.tipo || 'peca', fornecedor: String(l[pfFornecedorCol] || ''), cnpj: String(l[pfFornecedorCnpjCol] || ''),
          codigo: String(l[pfCodigoCol] || ''), descricao: String(l[pfDescricaoCol] || ''), dataCadastro: String(l[pfDtCadastroCol] || '')
        };
      })
      .filter(function (r) {
        return !texto || [r.pecaNome, r.fornecedor, r.cnpj, r.codigo, r.descricao].join(' ').toLowerCase().indexOf(texto) !== -1;
      })
      .sort(function (a, b) { return a.pecaNome.localeCompare(b.pecaNome, 'pt-BR') || a.fornecedor.localeCompare(b.fornecedor, 'pt-BR'); });
    return { sucesso: true, relacoes: lista };
  } catch (e) {
    return { sucesso: false, mensagem: 'Erro no servidor: ' + e.message, relacoes: [] };
  }
}

/** dados: { pecaId, fornecedor, cnpj, codigo, descricao } */
function salvarProdutoFornecedor(dados) {
  try {
    return executarComLock(function () {
      garantirAbasNotasFiscais_();
      const d = dados || {};
      const pecaId = Number(d.pecaId);
      if (!pecaId || !mapaPecasNF_()[pecaId]) return { sucesso: false, mensagem: 'Escolha a peça/produto do cadastro.' };
      if (!String(d.fornecedor || '').trim()) return { sucesso: false, mensagem: 'Informe o fornecedor.' };
      if (!String(d.codigo || '').trim()) return { sucesso: false, mensagem: 'Informe o código do produto no fornecedor.' };
      const mudou = gravarRelacaoProdutoFornecedor_(pecaId, d.fornecedor, d.cnpj, d.codigo, d.descricao);
      return { sucesso: true, mensagem: mudou ? 'Relação gravada.' : 'Essa relação já existia.' };
    });
  } catch (e) {
    return { sucesso: false, mensagem: 'Erro no servidor: ' + e.message };
  }
}

function excluirProdutoFornecedor(idInput) {
  try {
    return executarComLock(function () {
      const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(produtoFornecedorTableName);
      const idx = aba ? ReadProdutoFornecedor().findIndex(function (l) { return Number(l[pfIdCol]) === Number(idInput); }) : -1;
      if (idx === -1) return { sucesso: false, mensagem: 'Relação não encontrada.' };
      aba.getRange(idx + firstLineProdutoFornecedor, pfDtExclusaoCol + 1).setValue(hojeNF_());
      return { sucesso: true, mensagem: 'Relação excluída.' };
    });
  } catch (e) {
    return { sucesso: false, mensagem: 'Erro no servidor: ' + e.message };
  }
}

// ===== CONSULTA =====

function itensAtivosNota_(nfId, todos) {
  return (todos || ReadNfItens()).filter(function (l) {
    return Number(l[nfItemNfIdCol]) === Number(nfId) && !String(l[nfItemDtExclusaoCol] || '').trim();
  });
}

function anexosNota_(nfId) {
  if (!SpreadsheetApp.getActiveSpreadsheet().getSheetByName(nfAnexosTableName)) return [];
  return buscarAnexosGenerico(nfAnexosTableName, nfId, firstLineNfAnexos, numColumnsNfAnexos);
}

function resumoGarantiaNota_(l) {
  if (String(l[nfGarantiaTipoCol]) === 'produto') return 'Por produto' + (l[nfGarantiaAteCol] ? ' (geral até ' + l[nfGarantiaAteCol] + ')' : '');
  return l[nfGarantiaAteCol] ? 'Até ' + l[nfGarantiaAteCol] + (l[nfGarantiaMesesCol] !== '' ? ' (' + l[nfGarantiaMesesCol] + ' meses)' : '') : '';
}

/**
 * filtros: { texto, fornecedor, de, ate ('yyyy-MM-dd'), situacao
 * ('ativas' padrão | 'desativadas' | 'todas'), semRelacao (bool) }
 */
function listarNotasFiscais(filtros) {
  try {
    const f = filtros || {};
    const texto = String(f.texto || '').trim().toLowerCase();
    const fornecedor = String(f.fornecedor || '').trim().toLowerCase();
    const de = parseDataFlex(f.de), ate = parseDataFlex(f.ate);
    const itens = ReadNfItens();
    const pecas = mapaPecasNF_();
    const anexos = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(nfAnexosTableName)
      ? ReadSheet(nfAnexosTableName, firstLineNfAnexos, numColumnsNfAnexos).filter(function (l) { return !l[7]; }) : [];
    const lista = ReadNotasFiscais()
      .filter(function (l) { return String(l[nfIdCol] || '').trim() !== ''; })
      .map(function (l) {
        const id = Number(l[nfIdCol]);
        const its = itensAtivosNota_(id, itens);
        return {
          id: id, numero: String(l[nfNumeroCol] || ''), serie: String(l[nfSerieCol] || ''), chave: String(l[nfChaveCol] || ''),
          fornecedor: String(l[nfFornecedorCol] || ''), fornecedorCnpj: String(l[nfFornecedorCnpjCol] || ''),
          dataEmissao: String(l[nfDataEmissaoCol] || ''), valorTotal: l[nfValorTotalCol],
          garantiaTipo: String(l[nfGarantiaTipoCol] || 'geral'), garantiaResumo: resumoGarantiaNota_(l),
          qtdItens: its.length,
          qtdSemRelacao: its.filter(function (i) { return !Number(i[nfItemPecaIdCol]); }).length,
          qtdAnexos: anexos.filter(function (a) { return Number(a[1]) === id; }).length,
          desativada: String(l[nfDtExclusaoCol] || '').trim() !== '',
          _busca: [l[nfNumeroCol], l[nfChaveCol], l[nfFornecedorCol], l[nfFornecedorCnpjCol]].concat(its.map(function (i) {
            const p = pecas[Number(i[nfItemPecaIdCol])];
            return i[nfItemDescricaoCol] + ' ' + i[nfItemCodigoCol] + ' ' + (p ? p.nome : '');
          })).join(' ').toLowerCase()
        };
      })
      .filter(function (n) {
        const sit = f.situacao || 'ativas';
        if (sit === 'ativas' && n.desativada) return false;
        if (sit === 'desativadas' && !n.desativada) return false;
        if (texto && n._busca.indexOf(texto) === -1) return false;
        if (fornecedor && n.fornecedor.toLowerCase().indexOf(fornecedor) === -1) return false;
        const d = parseDataFlex(n.dataEmissao);
        if (de && (!d || d < de)) return false;
        if (ate && (!d || d > ate)) return false;
        if (f.semRelacao && !n.qtdSemRelacao) return false;
        return true;
      })
      .map(function (n) { delete n._busca; return n; })
      .sort(function (a, b) {
        const da = parseDataFlex(a.dataEmissao), db = parseDataFlex(b.dataEmissao);
        return ((db ? db.getTime() : 0) - (da ? da.getTime() : 0)) || b.id - a.id;
      });
    return { sucesso: true, notas: lista };
  } catch (e) {
    return { sucesso: false, mensagem: 'Erro no servidor: ' + e.message, notas: [] };
  }
}

function buscarNotaFiscal(idInput) {
  try {
    const id = Number(idInput);
    const l = ReadNotasFiscais().find(function (x) { return Number(x[nfIdCol]) === id; });
    if (!l) return { sucesso: false, mensagem: 'Nota fiscal não encontrada.' };
    const pecas = mapaPecasNF_();
    const emissao = parseDataFlex(l[nfDataEmissaoCol]);
    const tipo = String(l[nfGarantiaTipoCol] || 'geral');
    const itens = itensAtivosNota_(id).map(function (i) {
      const p = pecas[Number(i[nfItemPecaIdCol])];
      const meses = i[nfItemGarantiaMesesCol] === '' ? '' : Number(i[nfItemGarantiaMesesCol]);
      const ateProprio = tipo === 'produto' ? garantiaAteNF_(emissao, meses, String(i[nfItemGarantiaAteCol] || '')) : '';
      return {
        id: Number(i[nfItemIdCol]), itemNum: i[nfItemNumeroCol], codigo: String(i[nfItemCodigoCol] || ''),
        descricao: String(i[nfItemDescricaoCol] || ''), ncm: String(i[nfItemNcmCol] || ''), unidade: String(i[nfItemUnidadeCol] || ''),
        quantidade: i[nfItemQuantidadeCol], valorUnitario: i[nfItemValorUnitCol], valorTotal: i[nfItemValorTotalCol],
        pecaId: p ? p.id : null, pecaNome: p ? p.nome : '', pecaTipo: p ? p.tipo : '',
        garantiaMeses: meses, garantiaAte: String(i[nfItemGarantiaAteCol] || ''),
        garantiaEfetiva: ateProprio || String(l[nfGarantiaAteCol] || '')
      };
    });
    return {
      sucesso: true,
      nota: {
        id: id, numero: String(l[nfNumeroCol] || ''), serie: String(l[nfSerieCol] || ''), chave: String(l[nfChaveCol] || ''),
        fornecedor: String(l[nfFornecedorCol] || ''), fornecedorCnpj: String(l[nfFornecedorCnpjCol] || ''),
        dataEmissao: String(l[nfDataEmissaoCol] || ''), valorTotal: l[nfValorTotalCol], garantiaTipo: tipo,
        garantiaMeses: l[nfGarantiaMesesCol], garantiaAte: String(l[nfGarantiaAteCol] || ''), observacao: String(l[nfObservacaoCol] || ''),
        desativada: String(l[nfDtExclusaoCol] || '').trim() !== '', itens: itens, anexos: anexosNota_(id)
      }
    };
  } catch (e) {
    return { sucesso: false, mensagem: 'Erro no servidor: ' + e.message };
  }
}

// ===== GRAVAÇÃO =====

/**
 * dados: { id, numero, serie, chave, fornecedor, fornecedorCnpj,
 * dataEmissao, valorTotal, garantiaTipo, garantiaMeses, garantiaAte,
 * observacao, itens: [{ itemNum, codigo, descricao, ncm, unidade,
 * quantidade, valorUnitario, valorTotal, pecaId, garantiaMeses,
 * garantiaAte }], arquivos: [{ nome, tipo, base64, tipoAnexo }] }
 */
function salvarNotaFiscal(dados) {
  try {
    return executarComLock(function () { return salvarNotaFiscal_(dados || {}); });
  } catch (e) {
    return { sucesso: false, mensagem: 'Erro no servidor: ' + e.message };
  }
}

function salvarNotaFiscal_(d) {
  const id = Number(d.id) || 0;
  const numero = String(d.numero || '').trim();
  const serie = String(d.serie || '').trim();
  const chave = soDigitosNF_(d.chave);
  const fornecedor = String(d.fornecedor || '').trim();
  const cnpj = soDigitosNF_(d.fornecedorCnpj);
  const emissao = parseDataFlex(d.dataEmissao);
  if (!numero) return { sucesso: false, mensagem: 'Informe o número da nota.' };
  if (!fornecedor) return { sucesso: false, mensagem: 'Informe o fornecedor.' };
  if (!emissao) return { sucesso: false, mensagem: 'Informe a data de emissão.' };
  if (chave && chave.length !== 44) return { sucesso: false, mensagem: 'A chave de acesso deve ter 44 dígitos.' };

  // ----- garantia
  const tipo = d.garantiaTipo === 'produto' ? 'produto' : 'geral';
  const mesesGeral = mesesNF_(d.garantiaMeses);
  if (mesesGeral === null) return { sucesso: false, mensagem: 'Garantia geral: informe os meses em número inteiro.' };
  const ateGeralTexto = dataGarantiaTexto_(d.garantiaAte);
  if (ateGeralTexto === null) return { sucesso: false, mensagem: 'Garantia geral: data final inválida.' };
  const ateGeral = garantiaAteNF_(emissao, mesesGeral, ateGeralTexto);

  // ----- itens
  const pecas = mapaPecasNF_();
  const itens = [];
  const listaItens = Array.isArray(d.itens) ? d.itens : [];
  for (let i = 0; i < listaItens.length; i++) {
    const it = listaItens[i] || {};
    const descricao = String(it.descricao || '').trim();
    if (!descricao) return { sucesso: false, mensagem: 'Item ' + (i + 1) + ': informe a descrição.' };
    const pecaId = Number(it.pecaId) || '';
    if (pecaId && !pecas[pecaId]) return { sucesso: false, mensagem: 'Item ' + (i + 1) + ': peça/produto relacionado não encontrado.' };
    let meses = '', ateTexto = '';
    if (tipo === 'produto') {
      meses = mesesNF_(it.garantiaMeses);
      if (meses === null) return { sucesso: false, mensagem: 'Item ' + (i + 1) + ': garantia em meses deve ser número inteiro.' };
      ateTexto = dataGarantiaTexto_(it.garantiaAte);
      if (ateTexto === null) return { sucesso: false, mensagem: 'Item ' + (i + 1) + ': data final da garantia inválida.' };
    }
    const quantidade = numeroNF_(it.quantidade), valorUnitario = numeroNF_(it.valorUnitario);
    let valorTotal = numeroNF_(it.valorTotal);
    if (valorTotal === '' && quantidade !== '' && valorUnitario !== '') valorTotal = Math.round(quantidade * valorUnitario * 100) / 100;
    itens.push({
      itemNum: it.itemNum || (i + 1), codigo: String(it.codigo || '').trim(), descricao: descricao, ncm: String(it.ncm || '').trim(),
      unidade: String(it.unidade || '').trim(), quantidade: quantidade, valorUnitario: valorUnitario, valorTotal: valorTotal,
      pecaId: pecaId, garantiaMeses: meses, garantiaAte: ateTexto,
      garantiaEfetiva: (tipo === 'produto' ? garantiaAteNF_(emissao, meses, ateTexto) : '') || ateGeral
    });
  }
  if (!itens.length) return { sucesso: false, mensagem: 'Inclua pelo menos um item na nota (ou importe o XML).' };

  // sem garantia: pede a geral (ou a de cada produto)
  if (tipo === 'geral' && !ateGeral) {
    return { sucesso: false, mensagem: 'Informe a garantia geral da nota (meses ou data final). Ela vale para todos os itens.' };
  }
  const semGarantia = itens.filter(function (it) { return !it.garantiaEfetiva; });
  if (semGarantia.length) {
    return {
      sucesso: false,
      mensagem: 'Há itens sem garantia: ' + semGarantia.map(function (it) { return it.descricao; }).join('; ') +
        '. Informe a garantia de cada produto ou a garantia geral da nota (vale para os itens sem garantia própria).'
    };
  }

  garantirAbasNotasFiscais_();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const abaNF = ss.getSheetByName(notasFiscaisTableName);
  const notas = ReadNotasFiscais();

  // ----- nota repetida (mesma chave, ou mesmo número/série do mesmo fornecedor)
  const repetida = notas.find(function (l) {
    if (Number(l[nfIdCol]) === id || String(l[nfDtExclusaoCol] || '').trim()) return false;
    if (chave && soDigitosNF_(l[nfChaveCol]) === chave) return true;
    return String(l[nfNumeroCol] || '').trim() === numero && String(l[nfSerieCol] || '').trim() === serie &&
      mesmoFornecedorNF_(l[nfFornecedorCnpjCol], l[nfFornecedorCol], cnpj, fornecedor);
  });
  if (repetida) return { sucesso: false, mensagem: 'Esta nota já está cadastrada (nº ' + repetida[nfNumeroCol] + ', registro ' + repetida[nfIdCol] + ').' };

  const hoje = hojeNF_();
  const cabecalho = [numero, serie, chave, fornecedor, cnpj, dataBRNF_(emissao), numeroNF_(d.valorTotal), tipo,
    mesesGeral, ateGeral, String(d.observacao || '').trim()];
  let nfId = id;
  if (id) {
    const idx = notas.findIndex(function (l) { return Number(l[nfIdCol]) === id; });
    if (idx === -1) return { sucesso: false, mensagem: 'Nota fiscal não encontrada.' };
    if (String(notas[idx][nfDtExclusaoCol] || '').trim()) return { sucesso: false, mensagem: 'Nota desativada: reative antes de alterar.' };
    const linha = idx + firstLineNotasFiscais;
    abaNF.getRange(linha, nfNumeroCol + 1, 1, cabecalho.length).setValues([cabecalho]);
    abaNF.getRange(linha, nfDtAlteracaoCol + 1).setValue(hoje);
  } else {
    const pos = proximoIdTabela(abaNF, firstLineNotasFiscais);
    nfId = pos.novoId;
    abaNF.getRange(pos.proximaLinha, 1, 1, numColumnsNotasFiscais).setValues([[nfId].concat(cabecalho).concat([hoje, '', ''])]);
  }

  // ----- itens: os anteriores saem (exclusão lógica) e entram os atuais
  const abaItens = ss.getSheetByName(nfItensTableName);
  const todosItens = ReadNfItens();
  todosItens.forEach(function (l, i) {
    if (Number(l[nfItemNfIdCol]) === nfId && !String(l[nfItemDtExclusaoCol] || '').trim()) {
      abaItens.getRange(i + firstLineNfItens, nfItemDtExclusaoCol + 1).setValue(hoje);
    }
  });
  const posItem = proximoIdTabela(abaItens, firstLineNfItens);
  abaItens.getRange(posItem.proximaLinha, 1, itens.length, numColumnsNfItens).setValues(itens.map(function (it, k) {
    return [posItem.novoId + k, nfId, it.itemNum, it.codigo, it.descricao, it.ncm, it.unidade, it.quantidade,
      it.valorUnitario, it.valorTotal, it.pecaId, it.garantiaMeses, it.garantiaAte, ''];
  }));

  // ----- anexos enviados (nota escaneada, XML...)
  const nomesAnexos = [];
  (Array.isArray(d.arquivos) ? d.arquivos : []).forEach(function (arq) {
    if (!arq || !arq.base64) return;
    const tipoAnexo = TIPOS_ANEXO_NOTA.indexOf(arq.tipoAnexo) !== -1 ? arq.tipoAnexo : 'Outro';
    const r = adicionarAnexoGenerico({
      tabelaAnexos: nfAnexosTableName, idRegistro: nfId, tipo: tipoAnexo,
      arquivo: { nome: arq.nome, tipo: arq.tipo, base64: arq.base64 },
      firstLine: firstLineNfAnexos, numColumns: numColumnsNfAnexos
    });
    if (r.sucesso) nomesAnexos.push(r.nomeArquivo);
  });

  // ----- relação produto x fornecedor, aquisições e garantia da peça
  let relacoesNovas = 0;
  itens.forEach(function (it) {
    if (it.pecaId && gravarRelacaoProdutoFornecedor_(it.pecaId, fornecedor, cnpj, it.codigo, it.descricao)) relacoesNovas++;
  });
  sincronizarAquisicoesNota_(nfId);
  const pecasAtualizadas = completarPecasComNota_(nfId);

  const semRelacao = itens.filter(function (it) { return !it.pecaId; }).length;
  let mensagem = 'Nota fiscal ' + numero + (id ? ' alterada' : ' cadastrada') + ' com sucesso!';
  if (semRelacao) mensagem += '\n' + semRelacao + ' item(ns) sem relação com o cadastro de peças/produtos.';
  if (relacoesNovas) mensagem += '\n' + relacoesNovas + ' relação(ões) produto x fornecedor gravada(s).';
  if (pecasAtualizadas) mensagem += '\n' + pecasAtualizadas + ' peça(s)/produto(s) receberam a garantia/nota desta compra.';
  if (nomesAnexos.length) mensagem += '\n' + nomesAnexos.length + ' anexo(s) incluído(s).';
  return { sucesso: true, id: nfId, mensagem: mensagem };
}

/**
 * Itens relacionados da nota viram aquisições da peça (uma por peça e
 * nota), com o arquivo da nota escaneada. Peça que saiu da nota (ou nota
 * desativada) perde a aquisição. Sem lock próprio.
 */
function sincronizarAquisicoesNota_(nfId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const abaAq = ss.getSheetByName(pecasAquisicoesTableName);
  const nota = ReadNotasFiscais().find(function (l) { return Number(l[nfIdCol]) === Number(nfId); });
  if (!abaAq || !nota) return;
  const ativa = !String(nota[nfDtExclusaoCol] || '').trim();
  const desejadas = {};
  if (ativa) itensAtivosNota_(nfId).forEach(function (i) { if (Number(i[nfItemPecaIdCol])) desejadas[Number(i[nfItemPecaIdCol])] = true; });

  const escaneada = anexosNota_(nfId).filter(function (a) { return a.tipo === 'Nota escaneada'; }).pop() || null;
  const arquivo = escaneada ? [escaneada.nomeArquivo, escaneada.url, idArquivoDrive_(escaneada.url)] : ['', '', ''];
  const dadosNota = [String(nota[nfNumeroCol] || ''), String(nota[nfFornecedorCol] || ''), String(nota[nfDataEmissaoCol] || '')];
  const hoje = hojeNF_();

  const existentes = ReadPecasAquisicoes();
  existentes.forEach(function (l, i) {
    if (Number(l[aquisicaoNfIdCol]) !== Number(nfId) || String(l[aquisicaoDtExclusaoCol] || '').trim()) return;
    const linha = i + firstLinePecasAquisicoes;
    const pecaId = Number(l[aquisicaoPecaIdCol]);
    if (desejadas[pecaId]) {
      abaAq.getRange(linha, aquisicaoNumeroNFCol + 1, 1, 6).setValues([dadosNota.concat(arquivo)]);
      delete desejadas[pecaId];
    } else {
      abaAq.getRange(linha, aquisicaoDtExclusaoCol + 1).setValue(hoje);
    }
  });
  const novas = Object.keys(desejadas);
  if (!novas.length) return;
  const pos = proximoIdTabela(abaAq, firstLinePecasAquisicoes);
  abaAq.getRange(pos.proximaLinha, 1, novas.length, numColumnsPecasAquisicoes).setValues(novas.map(function (pecaId, k) {
    return [pos.novoId + k, Number(pecaId)].concat(dadosNota).concat(arquivo).concat([hoje, '', Number(nfId)]);
  }));
}

/**
 * Peça relacionada sem garantia (data final) ou sem nota cadastradas
 * recebe as desta compra. Devolve quantas foram completadas.
 */
function completarPecasComNota_(nfId) {
  const det = buscarNotaFiscal(nfId);
  if (!det.sucesso) return 0;
  const n = det.nota;
  const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(PartsTableName);
  const pecas = ReadParts();
  let qtd = 0;
  n.itens.forEach(function (it) {
    if (!it.pecaId) return;
    const idx = pecas.findIndex(function (l) { return Number(l[partsIdCol]) === Number(it.pecaId); });
    if (idx === -1) return;
    const l = pecas[idx], linha = idx + firstLineParts;
    let mudou = false;
    if (!String(l[partsDtGarantiaCol] || '').trim() && it.garantiaEfetiva) {
      const fim = parseDataFlex(it.garantiaEfetiva);
      aba.getRange(linha, partsDtGarantiaCol + 1).setValue(Utilities.formatDate(fim, 'GMT-3', 'yyyy-MM-dd'));
      const meses = it.garantiaMeses !== '' ? it.garantiaMeses : (n.garantiaMeses !== '' ? n.garantiaMeses : '');
      if (!String(l[partsGarantiaCol] || '').trim() && meses !== '') aba.getRange(linha, partsGarantiaCol + 1).setValue(meses + ' meses');
      mudou = true;
    }
    if (!String(l[partsNumNFCol] || '').trim()) {
      const emissao = parseDataFlex(n.dataEmissao);
      aba.getRange(linha, partsNumNFCol + 1, 1, 2).setValues([[n.numero, emissao ? Utilities.formatDate(emissao, 'GMT-3', 'yyyy-MM-dd') : '']]);
      if (!String(l[partsSuplierCol] || '').trim()) aba.getRange(linha, partsSuplierCol + 1).setValue(n.fornecedor);
      mudou = true;
    }
    if (mudou) { qtd++; pecas[idx][partsDtGarantiaCol] = pecas[idx][partsDtGarantiaCol] || 'x'; pecas[idx][partsNumNFCol] = pecas[idx][partsNumNFCol] || 'x'; }
  });
  return qtd;
}

function alterarSituacaoNotaFiscal_(idInput, desativar) {
  try {
    return executarComLock(function () {
      const id = Number(idInput);
      const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(notasFiscaisTableName);
      const idx = aba ? ReadNotasFiscais().findIndex(function (l) { return Number(l[nfIdCol]) === id; }) : -1;
      if (idx === -1) return { sucesso: false, mensagem: 'Nota fiscal não encontrada.' };
      aba.getRange(idx + firstLineNotasFiscais, nfDtExclusaoCol + 1).setValue(desativar ? hojeNF_() : '');
      sincronizarAquisicoesNota_(id);
      return { sucesso: true, mensagem: desativar ? 'Nota fiscal desativada.' : 'Nota fiscal reativada.' };
    });
  } catch (e) {
    return { sucesso: false, mensagem: 'Erro no servidor: ' + e.message };
  }
}

function desativarNotaFiscal(id) { return alterarSituacaoNotaFiscal_(id, true); }
function reativarNotaFiscal(id) { return alterarSituacaoNotaFiscal_(id, false); }

function excluirAnexoNotaFiscal(anexoId) {
  try {
    return executarComLock(function () {
      const r = excluirAnexoGenerico(nfAnexosTableName, anexoId, firstLineNfAnexos, numColumnsNfAnexos);
      if (r && r.sucesso && r.idRegistro) sincronizarAquisicoesNota_(Number(r.idRegistro));
      return r;
    });
  } catch (e) {
    return { sucesso: false, mensagem: 'Erro no servidor: ' + e.message };
  }
}
