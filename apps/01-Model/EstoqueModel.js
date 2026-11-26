// =====================================================
// MODEL - ESTOQUE (menu Estoque)
// Saldo de cada peça/produto do cadastro = soma das movimentações ativas.
// Constantes 0-based. Abas criadas sozinhas no primeiro uso
// (garantirAbasEstoque_) ou por criarTabelasNovasSeNecessario().
// =====================================================

// ===== tbl_estoque_movimentos =====
let estoqueMovTableName = 'tbl_estoque_movimentos'
let firstLineEstoqueMov = 3
let numColumnsEstoqueMov = 13

let movIdCol = 0
let movPecaIdCol = 1
let movTipoCol = 2              // 'entrada' | 'saida' | 'ajuste'
let movQuantidadeCol = 3        // entrada/saída: positiva; ajuste: diferença (+/-)
let movDataCol = 4              // dd/MM/yyyy
let movOrigemCol = 5            // 'nota_fiscal' | 'manual' | 'chamado' | 'equipamento'
let movOrigemIdCol = 6          // id da nota / do chamado / do equipamento
let movDocumentoCol = 7         // texto: "NF 1001", "Chamado #12", "Patrimônio 123"...
let movValorUnitCol = 8
let movObservacaoCol = 9
let movUsuarioCol = 10
let movDtCadastroCol = 11
let movDtExclusaoCol = 12       // estorno (exclusão lógica)

const CABECALHO_ESTOQUE_MOV = ['ID', 'PECA_ID', 'TIPO', 'QUANTIDADE', 'DATA', 'ORIGEM', 'ORIGEM_ID', 'DOCUMENTO',
  'VALOR_UNITARIO', 'OBSERVACAO', 'USUARIO', 'DATA_CADASTRO', 'DATA_EXCLUSAO']

// ===== tbl_estoque_parametros: mínimo e unidade por item =====
let estoqueParamTableName = 'tbl_estoque_parametros'
let firstLineEstoqueParam = 3
let numColumnsEstoqueParam = 5

let paramIdCol = 0
let paramPecaIdCol = 1
let paramMinimoCol = 2
let paramUnidadeCol = 3
let paramDtAlteracaoCol = 4

const CABECALHO_ESTOQUE_PARAM = ['ID', 'PECA_ID', 'ESTOQUE_MINIMO', 'UNIDADE', 'DATA_ALTERACAO']

function ReadEstoqueMovimentos() { return lerAbaDatas_(estoqueMovTableName, firstLineEstoqueMov, numColumnsEstoqueMov) }
function ReadEstoqueParametros() { return lerAbaDatas_(estoqueParamTableName, firstLineEstoqueParam, numColumnsEstoqueParam) }
