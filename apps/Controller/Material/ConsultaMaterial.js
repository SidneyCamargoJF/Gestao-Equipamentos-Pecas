

function botaoConsultar() {
  const planilha = SpreadsheetApp.getActive();
  const abaConsulta = planilha.getSheetByName("consulta material");
  const abaMateriais = planilha.getSheetByName("tab_materiais");
  
  // Forçar a gravação do texto
  SpreadsheetApp.flush();

  const ultimaLinha = abaMateriais.getLastRow();

  // Lê os inputs do usuário
  const patrimonio = abaConsulta.getRange("C2:D2").getValue();
  const modelo = abaConsulta.getRange("C4:D4").getValue();
  const marca = abaConsulta.getRange("G2:H2").getValue();
  const localizacao = abaConsulta.getRange("C6:D6").getValue();
  const btu = abaConsulta.getRange("G4:H4").getValue();
  const sequencia = abaConsulta.getRange("G6:H6").getValue();

  // Padroniza os inputs para letras minúsculas e remove espaços extras
  const fPatrimonio = String(patrimonio).trim().toLowerCase();
  const fModelo = String(modelo).trim().toLowerCase();
  const fMarca = String(marca).trim().toLowerCase();
  const fLocalizacao = String(localizacao).trim().toLowerCase();
  const fBtu = String(btu).trim().toLowerCase();
  const fSequencia = String(sequencia).trim().toLocaleLowerCase();
  
  const todosDados = abaMateriais.getRange(2, 2, ultimaLinha - 1, 6).getValues();
  let resultado = [];


  for (let linha = 0; linha < todosDados.length; linha++) {

    //Padroniza os dados do banco para letras minúsculas e remove espaços extras
    let dLocalizacao = String(todosDados[linha][0]).trim().toLowerCase();
    let dBtu = String(todosDados[linha][1]).trim().toLowerCase();
    let dMarca = String(todosDados[linha][2]).trim().toLowerCase();
    let dModelo = String(todosDados[linha][3]).trim().toLowerCase();
    let dPatrimonio = String(todosDados[linha][4]).trim().toLowerCase();
    let dSequencia = String(todosDados[linha][5]).trim().toLocaleLowerCase();

    //Comparações
    let condicao1 = (fPatrimonio === "" || dPatrimonio == fPatrimonio);
    let condicao2 = (fModelo === "" || dModelo == fModelo);
    let condicao3 = (fMarca === "" || dMarca == fMarca);
    let condicao4 = (fLocalizacao === "" || dLocalizacao == fLocalizacao);
    let condicao5 = (fBtu === "" || dBtu == fBtu);
    let condicao6 = (fSequencia === "" || dSequencia == fSequencia);
    
    if (condicao1 && condicao2 && condicao3 && condicao4 && condicao5 && condicao6) {
      resultado.push(todosDados[linha]);
    }
  }

  //Onde será exibido
  const intervaloExibicao = abaConsulta.getRange("B14:G");


  // Limpa o conteúdo antigo
  intervaloExibicao.clearContent();

  if (resultado.length > 0) {
    abaConsulta.getRange(14, 2, resultado.length, 6).setValues(resultado);
  } else {
    SpreadsheetApp.getUi().alert("Item não encontrado.");
  }
}

/*function onEdit(e) {
  const aba = e.source.getActiveSheet();
  const celula = e.range;
  const valor = e.value;
  
  const abaAlvo = "consulta material";
  const colunaDaCheckbox = 8;

  if (aba.getName() === abaAlvo && celula.getColumn() === colunaDaCheckbox && valor === "TRUE") {
    const linhaSelecionada = celula.getRow();
    
    const dadosLinhaSelecionada = aba.getRange(linhaSelecionada, 2, 1, 6).getValues()[0];
        
    redirecionarEdicao(dadosLinhaSelecionada);
    modoEdicao(true);

    celula.setValue(false);
  }
} */

function redirecionarEdicao(dados) {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  const abaCadastro = planilha.getSheetByName('cadastro material');
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

function modoEdicao(ativar) {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  const abaEdicao = planilha.getSheetByName('cadastro material');
  
  if (ativar === true) {
    abaEdicao.getRange("Z1").setValue(true);

  } else {
    abaEdicao.getRange("Z1").setValue(false);
  }
}
