// =====================================================
// MODEL - GARANTIAS (acionamento de garantia de peça / produto)
// Constantes 0-based (índice direto no array do Read*(); use col + 1 em
// getRange). As três abas são criadas sozinhas no primeiro uso
// (garantirAbasGarantias_) ou por criarTabelasNovasSeNecessario().
// =====================================================

// ===== tbl_garantias: um acionamento por linha =====
let garantiasTableName = 'tbl_garantias'
let firstLineGarantias = 3
let numColumnsGarantias = 15

let garantiaIdCol = 0
let garantiaPecaIdCol = 1
let garantiaFornecedorCol = 2         // nome do fornecedor (como em tbl_pecas)
let garantiaDtAberturaCol = 3         // dd/MM/yyyy
let garantiaDefeitoCol = 4
let garantiaProtocoloCol = 5          // protocolo/RMA do fornecedor
let garantiaStatusCol = 6
let garantiaDtEnvioCol = 7            // dd/MM/yyyy (enviada ao fornecedor)
let garantiaPrazoRespostaCol = 8      // dd/MM/yyyy
let garantiaResultadoCol = 9          // troca | reparo | reembolso | negada
let garantiaResolucaoCol = 10         // texto do encerramento
let garantiaDtEncerramentoCol = 11    // dd/MM/yyyy
let garantiaAbertoPorCol = 12
let garantiaDtAlteracaoCol = 13
let garantiaDtExclusaoCol = 14        // preenchida no cancelamento

const CABECALHO_GARANTIAS = ['ID', 'PECA_ID', 'FORNECEDOR', 'DATA_ABERTURA', 'DEFEITO', 'PROTOCOLO', 'STATUS',
  'DATA_ENVIO', 'PRAZO_RESPOSTA', 'RESULTADO', 'RESOLUCAO', 'DATA_ENCERRAMENTO', 'ABERTO_POR', 'DATA_ALTERACAO', 'DATA_EXCLUSAO']

// ===== tbl_garantia_historico =====
let garantiaHistTableName = 'tbl_garantia_historico'
let firstLineGarantiaHist = 3
let numColumnsGarantiaHist = 6

let garantiaHistIdCol = 0
let garantiaHistGarantiaIdCol = 1
let garantiaHistTextoCol = 2
let garantiaHistDataCol = 3           // dd/MM/yyyy HH:mm
let garantiaHistUsuarioCol = 4
let garantiaHistDtExclusaoCol = 5

const CABECALHO_GARANTIA_HIST = ['ID', 'GARANTIA_ID', 'TEXTO', 'DATA', 'USUARIO', 'DATA_EXCLUSAO']

// ===== tbl_garantia_anexos (mesmo formato dos anexos genéricos) =====
let garantiaAnexosTableName = 'tbl_garantia_anexos'
let firstLineGarantiaAnexos = 3
let numColumnsGarantiaAnexos = 8

const CABECALHO_GARANTIA_ANEXOS = ['ID', 'GARANTIA_ID', 'TIPO', 'NOME_ARQUIVO', 'URL', 'HASH', 'DATA_UPLOAD', 'DATA_EXCLUSAO']

function ReadGarantias() {
  return ReadSheetSeExistir(garantiasTableName, firstLineGarantias, numColumnsGarantias).map(linha =>
    linha.map(valor => (valor instanceof Date) ? dateToString(valor) : valor)
  )
}

function ReadGarantiaHistorico() {
  return ReadSheetSeExistir(garantiaHistTableName, firstLineGarantiaHist, numColumnsGarantiaHist).map(linha =>
    linha.map((valor, idx) => {
      if (!(valor instanceof Date)) return valor
      return idx === garantiaHistDataCol ? dateTimeToString(valor) : dateToString(valor)
    })
  )
}
