// =====================================================
// MODEL - tbl_pecas_aquisicoes
// Aquisições (compras) de uma peça/produto: o mesmo item pode ter sido
// comprado em épocas e de fornecedores diferentes. Cada uma com nº da nota,
// fornecedor, data e o arquivo da nota (Drive). Usadas para sugerir as
// notas no e-mail de garantia. Constantes 0-based. Criada sozinha no
// primeiro uso (ou por criarTabelasNovasSeNecessario()).
// =====================================================
let pecasAquisicoesTableName = 'tbl_pecas_aquisicoes'
let firstLinePecasAquisicoes = 3
let numColumnsPecasAquisicoes = 10

let aquisicaoIdCol = 0
let aquisicaoPecaIdCol = 1
let aquisicaoNumeroNFCol = 2
let aquisicaoFornecedorCol = 3
let aquisicaoDataCol = 4              // dd/MM/yyyy
let aquisicaoArquivoNomeCol = 5
let aquisicaoArquivoUrlCol = 6
let aquisicaoArquivoIdCol = 7         // id do arquivo no Drive (para anexar no e-mail)
let aquisicaoDtCadastroCol = 8
let aquisicaoDtExclusaoCol = 9

const CABECALHO_PECAS_AQUISICOES = ['ID', 'PECA_ID', 'NUMERO_NF', 'FORNECEDOR', 'DATA_AQUISICAO', 'ARQUIVO_NOME',
  'ARQUIVO_URL', 'ARQUIVO_ID', 'DATA_CADASTRO', 'DATA_EXCLUSAO']

function ReadPecasAquisicoes() {
  return ReadSheetSeExistir(pecasAquisicoesTableName, firstLinePecasAquisicoes, numColumnsPecasAquisicoes).map(linha =>
    linha.map(valor => (valor instanceof Date) ? dateToString(valor) : valor)
  )
}
