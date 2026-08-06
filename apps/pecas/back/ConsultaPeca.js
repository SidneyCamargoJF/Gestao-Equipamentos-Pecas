function consultarPeca() {
  const planilha = SpreadsheetApp.getActive();
  const abaConsultarPeca = planilha.getSheetByName("consulta peca");
  const abaTabelaPecas = planilha.getSheetByName("tab_pecas");

  SpreadsheetApp.flush();

  // Lê os inputs do usuário
  const nome = abaConsultarPeca.getRange("C2:D2").getValue();
  const capacidade = abaConsultarPeca.getRange("C4:D4").getValue();
  const fornecedor = abaConsultarPeca.getRange("C6:D6").getValue();
  const marca = abaConsultarPeca.getRange("C8:D8").getValue();
  const numeroDeSerie = abaConsultarPeca.getRange("G2:H2").getValue();
  const notaFiscal = abaConsultarPeca.getRange("G4:H4").getValue();
  const dataNotaFiscal = abaConsultarPeca.getRange("G6:H6").getValue();
  const garantia = abaConsultarPeca.getRange("G8:H8").getValue();
  const modalidade = abaConsultarPeca.getRange("K2:L2").getValue();
  const valor = abaConsultarPeca.getRange("K4:L4").getValue();

  // Padroniza os inputs para letras minúsculas e remove espaços extras
  const sNome = String(nome).trim().toLowerCase();
  const sCapacidade = String(capacidade).trim().toLowerCase();
  const sFornecedor = String(fornecedor).trim().toLowerCase();
  const sMarca = String(marca).trim().toLowerCase();
  const sNumeroDeSerie = String(numeroDeSerie).trim().toLowerCase();
  const sNotaFiscal = String(notaFiscal).trim().toLowerCase();
  const sDataNotaFiscal = String(dataNotaFiscal).trim().toLowerCase();
  const sGarantia = String(garantia).trim().toLowerCase();
  const sModalidade = String(modalidade).trim().toLowerCase();
  const sValor = String(valor).trim().toLowerCase();

  const ultimaLinha = abaTabelaPecas.getLastRow();

  const todosDados = abaTabelaPecas.getRange(2, 2, ultimaLinha - 1, 10).getValues();
  let pecaDados = []

  for (let linha = 0; linha < todosDados.length; linha++){

    //Padroniza os dados do banco para letras minúsculas e remove espaços extras
    let tNome = String(todosDados[linha][0]).trim().toLowerCase();
    let tMarca = String(todosDados[linha][1]).trim().toLowerCase();
    let tCapacidade = String(todosDados[linha][2]).trim().toLowerCase();
    let tNumeroDeSerie = String(todosDados[linha][3]).trim().toLowerCase();
    let tFornecedor = String(todosDados[linha][4]).trim().toLowerCase();
    let tNotaFiscal = String(todosDados[linha][5]).trim().toLowerCase();
    let tDataNotaFiscal = String(todosDados[linha][6]).trim().toLowerCase();
    let tGarantia = String(todosDados[linha][7]).trim().toLowerCase();
    let tModalidade = String(todosDados[linha][8]).trim().toLowerCase();
    let tValor = String(todosDados[linha][9]).trim().toLowerCase();


    let condicao1 = (sNome === "" || tNome == sNome);
    let condicao2 = (sMarca === "" || tMarca == sMarca);
    let condicao3 = (sCapacidade === "" || tCapacidade == sCapacidade);
    let condicao4 = (sNumeroDeSerie === "" || tNumeroDeSerie == sNumeroDeSerie);
    let condicao5 = (sFornecedor === "" || tFornecedor == sFornecedor);
    let condicao6 = (sNotaFiscal === "" || tNotaFiscal == sNotaFiscal);
    let condicao7 = (sDataNotaFiscal === "" || tDataNotaFiscal == sDataNotaFiscal);
    let condicao8 = (sGarantia === "" || tGarantia == sGarantia);
    let condicao9 = (sModalidade === "" || tModalidade == sModalidade);
    let condicao10 = (sValor === "" || tValor == sValor);

    if (condicao1 && condicao2 && condicao3 && condicao4 && condicao5 && condicao6 && condicao7 && condicao8 && condicao9 && condicao10){
      pecaDados.push(todosDados[linha]);
    }

  }

  const intervaloExibicao = abaConsultarPeca.getRange("B15:K");

  intervaloExibicao.clearContent();

  if (pecaDados.length > 0) {
    abaConsultarPeca.getRange(15, 2, pecaDados.length, 10).setValues(pecaDados);
  }
  else {
    SpreadsheetApp.getUi().alert("Peça não encontrada");
  }


}


function redirecionarEdicaoPeca(dados) {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  const abaCadastro = planilha.getSheetByName('cadastro pecas');
  SpreadsheetApp.setActiveSheet(abaCadastro);

  //Indicador de edição
  abaCadastro.getRange("Z1").setValue(dados[4]); 

  abaCadastro.getRange("C3").setValue(dados[4]);
  abaCadastro.getRange("C5").setValue(dados[2]);
  abaCadastro.getRange("C7").setValue(dados[3]);
  abaCadastro.getRange("C9").setValue(dados[5]);
  abaCadastro.getRange("C11").setValue(dados[0]);
  abaCadastro.getRange("C13").setValue(dados[1]);

}

function modoEdicaoPeca(ativar) {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  const abaEdicao = planilha.getSheetByName('cadastro material');
  
  if (ativar === true) {
    abaEdicao.getRange("Z1").setValue(true);

  } else {
    abaEdicao.getRange("Z1").setValue(false);
  }
}


