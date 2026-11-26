// =====================================================
// MODEL - NOTAS FISCAIS (Compras > Notas fiscais)
// Constantes 0-based. As abas são criadas sozinhas no primeiro uso
// (garantirAbasNotasFiscais_) ou por criarTabelasNovasSeNecessario().
// =====================================================

// ===== tbl_notas_fiscais: cabeçalho da nota =====
let notasFiscaisTableName = 'tbl_notas_fiscais'
let firstLineNotasFiscais = 3
let numColumnsNotasFiscais = 15

let nfIdCol = 0
let nfNumeroCol = 1
let nfSerieCol = 2
let nfChaveCol = 3                 // chave de acesso (44 dígitos)
let nfFornecedorCol = 4            // nome (razão social), como no cadastro de fornecedores
let nfFornecedorCnpjCol = 5
let nfDataEmissaoCol = 6           // dd/MM/yyyy
let nfValorTotalCol = 7
let nfGarantiaTipoCol = 8          // 'geral' | 'produto'
let nfGarantiaMesesCol = 9         // garantia geral (meses)
let nfGarantiaAteCol = 10          // garantia geral (data final, dd/MM/yyyy)
let nfObservacaoCol = 11
let nfDtCadastroCol = 12
let nfDtAlteracaoCol = 13
let nfDtExclusaoCol = 14

const CABECALHO_NOTAS_FISCAIS = ['ID', 'NUMERO', 'SERIE', 'CHAVE', 'FORNECEDOR', 'FORNECEDOR_CNPJ', 'DATA_EMISSAO',
  'VALOR_TOTAL', 'GARANTIA_TIPO', 'GARANTIA_MESES', 'GARANTIA_ATE', 'OBSERVACAO', 'DATA_CADASTRO', 'DATA_ALTERACAO', 'DATA_EXCLUSAO']

// ===== tbl_notas_fiscais_itens: itens (produtos) da nota =====
let nfItensTableName = 'tbl_notas_fiscais_itens'
let firstLineNfItens = 3
let numColumnsNfItens = 14

let nfItemIdCol = 0
let nfItemNfIdCol = 1
let nfItemNumeroCol = 2            // nItem do XML
let nfItemCodigoCol = 3            // código do produto no fornecedor (cProd)
let nfItemDescricaoCol = 4         // descrição na nota (xProd)
let nfItemNcmCol = 5
let nfItemUnidadeCol = 6
let nfItemQuantidadeCol = 7
let nfItemValorUnitCol = 8
let nfItemValorTotalCol = 9
let nfItemPecaIdCol = 10           // peça/produto do cadastro relacionado ('' = sem relação)
let nfItemGarantiaMesesCol = 11    // garantia do produto (quando a nota é "por produto")
let nfItemGarantiaAteCol = 12
let nfItemDtExclusaoCol = 13

const CABECALHO_NF_ITENS = ['ID', 'NF_ID', 'ITEM', 'CODIGO_FORNECEDOR', 'DESCRICAO', 'NCM', 'UNIDADE', 'QUANTIDADE',
  'VALOR_UNITARIO', 'VALOR_TOTAL', 'PECA_ID', 'GARANTIA_MESES', 'GARANTIA_ATE', 'DATA_EXCLUSAO']

// ===== tbl_notas_fiscais_anexos (formato dos anexos genéricos) =====
let nfAnexosTableName = 'tbl_notas_fiscais_anexos'
let firstLineNfAnexos = 3
let numColumnsNfAnexos = 8

const CABECALHO_NF_ANEXOS = ['ID', 'NF_ID', 'TIPO', 'NOME_ARQUIVO', 'URL', 'HASH', 'DATA_UPLOAD', 'DATA_EXCLUSAO']

// ===== tbl_produto_fornecedor: produto x fornecedor x código =====
// Como cada fornecedor chama o item do cadastro (código e descrição na
// nota). Usada para relacionar sozinho os itens do XML.
let produtoFornecedorTableName = 'tbl_produto_fornecedor'
let firstLineProdutoFornecedor = 3
let numColumnsProdutoFornecedor = 8

let pfIdCol = 0
let pfPecaIdCol = 1
let pfFornecedorCol = 2
let pfFornecedorCnpjCol = 3
let pfCodigoCol = 4
let pfDescricaoCol = 5
let pfDtCadastroCol = 6
let pfDtExclusaoCol = 7

const CABECALHO_PRODUTO_FORNECEDOR = ['ID', 'PECA_ID', 'FORNECEDOR', 'FORNECEDOR_CNPJ', 'CODIGO_FORNECEDOR',
  'DESCRICAO_FORNECEDOR', 'DATA_CADASTRO', 'DATA_EXCLUSAO']

function lerAbaDatas_(nome, primeira, colunas) {
  return ReadSheetSeExistir(nome, primeira, colunas).map(linha =>
    linha.map(valor => (valor instanceof Date) ? dateToString(valor) : valor)
  )
}

function ReadNotasFiscais() { return lerAbaDatas_(notasFiscaisTableName, firstLineNotasFiscais, numColumnsNotasFiscais) }
function ReadNfItens() { return lerAbaDatas_(nfItensTableName, firstLineNfItens, numColumnsNfItens) }
function ReadProdutoFornecedor() { return lerAbaDatas_(produtoFornecedorTableName, firstLineProdutoFornecedor, numColumnsProdutoFornecedor) }
