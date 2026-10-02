let LocalTableName = 'tbl_localizacao'
let firstLineLocal  = 3
let numColumnsLocal = 5

let localIdCol = 1
let localNameCol = 2
let localDtCadastroCol = 3
let LocalDtExclusaoCol = 4
let LocalDtAlteracao = 5

function ReadLocations() {

  return ReadSheet('tbl_localizacao', 3, 2)
}

/**
 * Cadastra uma nova localização (só o nome). Chamado pelo botão "+" ao lado
 * do campo Localização no Cadastro de Peças.
 */
function cadastrarLocalizacao(nomeLocalizacaoInput) {
  try {
    const nomeLocalizacao = (nomeLocalizacaoInput || "").toString().trim();

    if (nomeLocalizacao === "") {
      return { sucesso: false, mensagem: "Digite o nome da localização." };
    }

    const planilha = SpreadsheetApp.getActiveSpreadsheet();
    const abaLocalizacao = planilha.getSheetByName(LocalTableName);

    if (!abaLocalizacao) {
      return { sucesso: false, mensagem: "Aba '" + LocalTableName + "' não foi encontrada na planilha." };
    }

    const dadosExistentes = ReadLocations();
    const jaExiste = dadosExistentes.some(linha => String(linha[1] || "").trim().toLowerCase() === nomeLocalizacao.toLowerCase());

    if (jaExiste) {
      return { sucesso: false, mensagem: "Esta localização já está cadastrada." };
    }

    const ultimaLinha = abaLocalizacao.getLastRow();
    let novoId = 1;
    const dataHoje = Utilities.formatDate(new Date(), "GMT-3", "dd/MM/yyyy");
    if (ultimaLinha >= firstLineLocal) {
      const ultimoId = abaLocalizacao.getRange(ultimaLinha, 1).getValue();
      novoId = isNaN(Number(ultimoId)) ? 1 : Number(ultimoId) + 1;
    }

    abaLocalizacao.appendRow([novoId, nomeLocalizacao, dataHoje]);

    return { sucesso: true, mensagem: "Localização cadastrada com sucesso!", id: novoId };
  } catch (e) {
    return { sucesso: false, mensagem: "Erro no servidor: " + e.message };
  }
}


