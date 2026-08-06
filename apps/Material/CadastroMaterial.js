
function cadastrarMaterial() {
  
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var pat_material = ss.getRange('C3:D3').getValue();
  var marca_material = ss.getRange('C5:D5').getValue();
  var modelo_material = ss.getRange('C7:D7').getValue();
  var btu_material = ss.getRange('C13:D13').getValue();
  var localizacao_material = ss.getRange('C11:D11').getValue();
  var sequencia_material = ss.getRange('C9:D9').getValue();
  var data_cadastro = Utilities.formatDate(new Date(), "GMT-3", "dd/MM/yyyy")

  if (pat_material == "" || marca_material == "" || modelo_material == "" || btu_material == "" || localizacao_material == "" || sequencia_material == ""){
    SpreadsheetApp.getUi().alert("ERRO: Faltam dados obrigatórios.")
    return;
  }

  if (isNaN(pat_material)) {
    SpreadsheetApp.getUi().alert("AVISO DE CADASTRO", "ERRO: Você não digitou uma palavra. Digite um número para prosseguir.", SpreadsheetApp.getUi().ButtonSet.OK);
  }

   var info = [localizacao_material, btu_material, marca_material, modelo_material, pat_material, sequencia_material, data_cadastro, "" ]

  var sx = ss.getSheetByName('tab_materiais');
  ultima_linha = sx.getLastRow();

  id = sx.getRange(ultima_linha, 1).getValue();

  if (id == "ID"){
    id = 0;
  }

  //Verificacao de Patrimonio e Sequencia repetidos  
  var coluna_patrimonio = sx.getRange('F2:F').getValues().flat();
  var coluna_sequencia = sx.getRange('G2:G').getValues().flat();

  verificarCampo(coluna_patrimonio, pat_material, "patrimônio");
  
  verificarCampo(coluna_sequencia, sequencia_material, "sequência");

  // Preenchimento da planilha
  for (let i = 0; i < 8; i++){

    if (i == 0 ){
        sx.getRange(ultima_linha + 1, i + 1).setValue(id + 1);
    }

    sx.getRange(ultima_linha + 1, i + 2).setValue(info[i]);
  }

  ss.getRange('C3:D3').clearContent();
  ss.getRange('C5:D5').clearContent();
  ss.getRange('C7:D7').clearContent();
  ss.getRange('C9:D9').clearContent();
  ss.getRange('C11:D11').clearContent();
  ss.getRange('C13:D13').clearContent();

  SpreadsheetApp.getUi().alert("Cadastro com Sucesso!");

}


function verificarCampo(campo, valor, tipo_valor) {

  if (campo.includes(valor)){
    SpreadsheetApp.getUi().alert("AVISO DE CADASTRO", "ERRO: Já existe um material com esse " + tipo_valor + ".",SpreadsheetApp.getUi().ButtonSet.OK );
  }

}

function botaoEditar() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const abaCad = ss.getSheetByName('cadastro material');
  const sx = ss.getSheetByName('tab_materiais');
  
  // Pega os dados atuais que estão no formulário de edição
  const patrimonioAlvo = abaCad.getRange('C3').getValue().toString().trim();
  const novaMarca = abaCad.getRange('C5').getValue();
  const novoModelo = abaCad.getRange('C7').getValue();
  const novaSequencia = abaCad.getRange('C9').getValue();
  const novaLocalizacao = abaCad.getRange('C11').getValue();
  const novoBtu = abaCad.getRange('C13').getValue();
  const dataEdicao = Utilities.formatDate(new Date(), "GMT-3", "dd/MM/yyyy");

  if (patrimonioAlvo == "") {
    SpreadsheetApp.getUi().alert("ERRO: O campo de Patrimônio (C3) não pode estar vazio para editar.");
    return;
  }

  const resposta = SpreadsheetApp.getUi().alert('CONFIRMAÇÃO', 'Deseja salvar as alterações para o patrimônio ' + patrimonioAlvo + '?', SpreadsheetApp.getUi().ButtonSet.YES_NO);
  if (resposta !== SpreadsheetApp.getUi().Button.YES) return;

  const ult_material = sx.getLastRow();
  if (ult_material <= 1) {
    SpreadsheetApp.getUi().alert("ERRO: A tabela de materiais está vazia.");
    return;
  }

  // Pega a lista de patrimônios existentes da coluna F (Índice 5 no banco de dados)
  const listaPatrimonios = sx.getRange(2, 6, ult_material - 1, 1).getValues().flat();
  let linhaLocalizada = -1;

  // Busca se o patrimônio digitado existe na tabela
  for (let i = 0; i < listaPatrimonios.length; i++) {
    if (listaPatrimonios[i].toString().trim() === patrimonioAlvo) {
      linhaLocalizada = i + 2; // +2 compensa o cabeçalho e o índice zero
      break;
    }
  }

  // Se encontrou o material, atualiza os dados dele
  if (linhaLocalizada !== -1) {
    sx.getRange(linhaLocalizada, 2).setValue(novaLocalizacao);  // Coluna B
    sx.getRange(linhaLocalizada, 3).setValue(novoBtu);          // Coluna C
    sx.getRange(linhaLocalizada, 4).setValue(novaMarca);        // Coluna D
    sx.getRange(linhaLocalizada, 5).setValue(novoModelo);       // Coluna E
    sx.getRange(linhaLocalizada, 7).setValue(novaSequencia);    // Coluna G
    sx.getRange(linhaLocalizada, 9).setValue(dataEdicao);       // Coluna I

    // Limpa o formulário e redireciona
    abaCad.getRangeList(['C3', 'C5', 'C7', 'C9', 'C11', 'C13']).clearContent();
    
    const abaConsulta = ss.getSheetByName('consulta material');
    if (abaConsulta) ss.setActiveSheet(abaConsulta);
    
    SpreadsheetApp.getUi().alert("Material editado com sucesso!");
  } else {
    SpreadsheetApp.getUi().alert("ERRO: O patrimônio " + patrimonioAlvo + " não foi encontrado para edição.");
  }
}


function verificarCampoPatrimonio(ss, valor, linha, coluna) {
  const abaCadastroMaterial = ss.getName();
  if (linha === 3 && (coluna === 3 || coluna === 4) && abaCadastroMaterial === 'cadastro material') {

    var sx = ss.getSheetByName('tab_materiais')
    let valoresDaColuna = sx.getRange('F2:F' + sx.getLastRow()).getValues().flat();
    let colunaSet = new Set(valoresDaColuna);

    if (colunaSet.has(valor)) {
      const ui = SpreadsheetApp.getUi();
      const resposta = ui.alert("AVISO DE CADASTRO", "ERRO: Já existe um material com esse patrimônio. Gostaria de editá-lo?", SpreadsheetApp.getUi().ButtonSet.YES_NO);

      if (resposta == ui.Button.YES){
        buscarMaterialPorPatrimonio();
      }
      else {
        SpreadsheetApp.getUi().alert("Continuando com o cadastro. Coloque um patrimônio para cadastrá-lo.");

      }
    }
  }

}


function buscarMaterialPorPatrimonio() {
  
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var patrimonio = ss.getRange('C3:D3').getValue();

  const sx = ss.getSheetByName('tab_materiais')

  var pat_mat = sx.getLastRow();
  var dados_material = sx.getRange(2, 2, pat_mat - 1, 9).getValues();

  var dados = [];
  for (let i = 0; i < dados_material.length; i++){
    if (dados_material[i][4] == patrimonio){

      for (let y = 0; y < 9 ; y++){
        dados.push(dados_material[i][y]);
      }

      break
    }
  }
  
  const sc = ss.getSheetByName('cadastro material');

  sc.getRange('C3:D3').setValue(dados[4]);
  sc.getRange('C5:D5').setValue(dados[2]);
  sc.getRange('C7:D7').setValue(dados[3]);
  sc.getRange('C9:D9').setValue(dados[7]);
  sc.getRange('C11:D11').setValue(dados[0]);
  sc.getRange('C13:D13').setValue(dados[1]);
}


function verificarCampoSequencia(ss, valor, linha, coluna) {
  const abaCadastroMaterial = ss.getName();
  if (linha === 13 && (coluna === 3 || coluna === 4) && abaCadastroMaterial === 'cadastro material') {

    var sx = ss.getSheetByName('tab_materiais')
    let valoresDaColuna = sx.getRange('I2:I' + sx.getLastRow()).getValues().flat();
    let colunaSet = new Set(valoresDaColuna);

    if (colunaSet.has(valor)) {
      SpreadsheetApp.getUi().alert("AVISO DE CADASTRO", "ERRO: Já existe um material com essa sequência. Gostaria de editá-lo?", SpreadsheetApp.getUi().ButtonSet.YES_NO);
    }
  }

}

