function cadastrarPeca() {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();  
  const abaRegistroPecas = planilha.getSheetByName("tab_pecas");
  const abaCadastroPecas = planilha.getSheetByName("cadastro peca");
  const abaRegistroMarca = planilha.getSheetByName("tab_marca")
  const ultima_linha = abaRegistroPecas.getLastRow();
  const data_cadastro = Utilities.formatDate(new Date(), "GMT-3", "dd/MM/yyyy");


  //Campos inseridos
  const nome = planilha.getRange('C4:D4').getValue();
  const marca = planilha.getRange('C6:D6').getValue();
  const valor = planilha.getRange('C9:D9').getValue();
  const numero_serie = planilha.getRange('C11:D11').getValue();
  const fornecedor = planilha.getRange('C13:D13').getValue();
  const notaFiscal = planilha.getRange('C16:D16').getValue();  
  const dataNotaFiscal = planilha.getRange('C18:D18').getValue();
  const garantia = planilha.getRange('C20:D20').getValue();
  const modalidade = planilha.getRange('C22:D22').getValue();  
  const capacidade = planilha.getRange('C24:D24').getValue();

  //DESCUTIR DEPOIS QUAIS SAO OS CAMPOS OBRIGATORIOS
  if (nome == "" || marca == "" || capacidade == "" || numero_serie == "" || fornecedor == "" || notaFiscal == "" || dataNotaFiscal == "" || garantia == "" || modalidade == "" || valor == ""){
  SpreadsheetApp.getUi().alert("ERRO: Faltam dados obrigatórios.")
  return;
  }

  const ultimaLinhaMarcas = abaRegistroMarca.getLastRow();
  const dadosMarcas = abaRegistroMarca.getRange(2, 1, ultimaLinhaMarcas - 1, 2).getValues();
  let idMarcaEncontrado = null;

  // Pegar id da marca
  for (let i = 0; i < dadosMarcas.length - 1; i++){
    if(dadosMarcas[i][1] == marca) {
      idMarcaEncontrado = dadosMarcas[i][0];
      break;
    }
  }

  if (idMarcaEncontrado === null) {
    SpreadsheetApp.getUi().alert("ERRO: O ID desta marca não foi localizado na tabela de marcas.");
    return;
  }

  //Armazena os inputs em um vetor
  dadosInseridos = [nome, idMarcaEncontrado, capacidade, numero_serie, fornecedor, notaFiscal, dataNotaFiscal, garantia, modalidade, valor, data_cadastro];

  let id = abaRegistroPecas.getRange(ultima_linha, 1).getValue();

  //Verifica se ID já existe
  if (id == "ID"){
    id = 0;
  }

  // Preenchimento da aba de registro de peças
  for (let i = 0; i < 11; i++){

    if (i == 0 ){
      abaRegistroPecas.getRange(ultima_linha + 1, i + 1).setValue(id + 1);
    }

    // Passa o dado da array correspondente ao contador do loop
    abaRegistroPecas.getRange(ultima_linha + 1, i + 2).setValue(dadosInseridos[i]);
  }

  SpreadsheetApp.getUi().alert("Cadastro realizado com sucesso!");

  //Limpar o conteúdo anterior
  abaCadastroPecas.getRange('C4:D4').clearContent();
  abaCadastroPecas.getRange('C6:D6').clearContent();
  abaCadastroPecas.getRange('C9:D89').clearContent();
  abaCadastroPecas.getRange('C11:D11').clearContent();
  abaCadastroPecas.getRange('C13:D13').clearContent();
  abaCadastroPecas.getRange('C16:D16').clearContent();
  abaCadastroPecas.getRange('C18:D18').clearContent();
  abaCadastroPecas.getRange('C20:D20').clearContent();
  abaCadastroPecas.getRange('C22:D22').clearContent();
  abaCadastroPecas.getRange('C24:D24').clearContent();

}

function editarPeca () {
  
}

function redirecionarMarca() {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  const abaCadastroMarca = planilha.getSheetByName('cadastro marca');
  SpreadsheetApp.setActiveSheet(abaCadastroMarca);
}

function cadastrarMarca() {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  const nomeMarca = planilha.getRange('E4').getValue().toString().trim();
  
  if (nomeMarca == "") {
    SpreadsheetApp.getUi().alert("AVISO", "Digite o nome da marca.", SpreadsheetApp.getUi().ButtonSet.OK);
    return;
  }

  const abaConsultaMarca = planilha.getSheetByName('tab_marca');
  const ultimaLinha = abaConsultaMarca.getLastRow();
  const dataHoje = Utilities.formatDate(new Date(), "GMT-3", "dd/MM/yyyy");

  if (ultimaLinha > 1) {
    const dadosMarcas = abaConsultaMarca.getRange(2, 1, ultimaLinha - 1, 4).getValues();
    let linhaInativaEncontrada = -1;

    for (let i = 0; i < dadosMarcas.length; i++) {
      const nomeTabela = dadosMarcas[i][1].toString().trim().toLowerCase();
      const dataExclusaoTabela = dadosMarcas[i][3].toString().trim();

      if (nomeTabela === nomeMarca.toLowerCase()) {
        if (dataExclusaoTabela === "") {
          SpreadsheetApp.getUi().alert("MARCA CADASTRADA", "Esta marca já está cadastrada e ativa no sistema.", SpreadsheetApp.getUi().ButtonSet.OK);
          return;
        } else {
          linhaInativaEncontrada = i + 2;
        }
      }
    }

    //Reativar uma marca excluída
    if (linhaInativaEncontrada !== -1) {
      abaConsultaMarca.getRange(linhaInativaEncontrada, 4).clearContent();
      abaConsultaMarca.getRange(linhaInativaEncontrada, 3).setValue(dataHoje);
      abaConsultaMarca.getRange(linhaInativaEncontrada, 1, 1, 4).setBackground("#FFFFFF");

      planilha.getRange('E4').clearContent();
      SpreadsheetApp.getUi().alert("SUCESSO", "Esta marca já existia e foi reativada.", SpreadsheetApp.getUi().ButtonSet.OK);
      return;
    }
  }

  //Marca nova
  let id = 1;
  if (ultimaLinha > 1) {
    const ultimoId = abaConsultaMarca.getRange(ultimaLinha, 1).getValue();
    id = Number(ultimoId) + 1;
  }
  
  abaConsultaMarca.appendRow([id, nomeMarca, dataHoje, ""]);
  const novaUltimaLinha = abaConsultaMarca.getLastRow();
  abaConsultaMarca.getRange(novaUltimaLinha, 1, 1, 4).setBackground("#FFFFFF");

  planilha.getRange('E4').clearContent();
  SpreadsheetApp.getUi().alert("SUCESSO", "Marca cadastrada com sucesso.", SpreadsheetApp.getUi().ButtonSet.OK);

  atualizarMarcas();
}


function excluirMarca() {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  const nomeMarca = planilha.getRange('E4').getValue().toString().trim();
  const abaConsultaMarca = planilha.getSheetByName('tab_marca');

  if (nomeMarca === "") {
    SpreadsheetApp.getUi().alert("AVISO", "Digite o nome da marca que deseja excluir.", SpreadsheetApp.getUi().ButtonSet.OK);
    return;
  }

  const resposta = SpreadsheetApp.getUi().alert('CONFIRMAÇÃO', 'Tem certeza que deseja excluir a marca "' + nomeMarca + '"?', SpreadsheetApp.getUi().ButtonSet.YES_NO);
  if (resposta !== SpreadsheetApp.getUi().Button.YES) return;

  const ultima_linha = abaConsultaMarca.getLastRow();
  if (ultima_linha <= 1) {
    SpreadsheetApp.getUi().alert("Não há materiais para serem excluídos");
    return;
  }

  const dadosMarcas = abaConsultaMarca.getRange(2, 1, ultima_linha - 1, 4).getValues();
  let linhaLocalizada = -1;

  for (let i = 0; i < dadosMarcas.length; i++) {
    const nomeTabela = dadosMarcas[i][1].toString().trim().toLowerCase();
    const dataExclusaoTabela = dadosMarcas[i][3].toString().trim();

    if (nomeTabela === nomeMarca.toLowerCase() && dataExclusaoTabela === "") {
      linhaLocalizada = i + 2;
      break;
    }
  }

  if (linhaLocalizada !== -1) {
    const data_exclusao = Utilities.formatDate(new Date(), "GMT-3", "dd/MM/yyyy");
    
    abaConsultaMarca.getRange(linhaLocalizada, 4).setValue(data_exclusao);
    abaConsultaMarca.getRange(linhaLocalizada, 1, 1, 4).setBackground("#F4CCCC");
    
    planilha.getRange('E4').clearContent();
  } else {
    SpreadsheetApp.getUi().alert("ERRO", "Marca ativa não encontrada (pode já estar excluída).", SpreadsheetApp.getUi().ButtonSet.OK);
  }

  atualizarMarcas();
}

function atualizarMarcas() {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  const abaConsultaMarca = planilha.getSheetByName('tab_marca');
  const abaCadastroPeca = planilha.getSheetByName('cadastro peca');

  const ultima_linha = abaConsultaMarca.getLastRow();
  if (ultima_linha < 2) {
    return;
  }

  const marcas = abaConsultaMarca.getRange(2, 2, ultima_linha - 1, 1).getValues();
  const marcasExcluidas = abaConsultaMarca.getRange(2, 4, ultima_linha -1, 1).getValues();

  const marcasValidas = [];

  for (i = 0; i < marcas.length; i++) {
    const nomeMarca = marcas[i][0];
    const dataExclusao = marcasExcluidas[i][0];

    if(nomeMarca !== "" && dataExclusao === ""){
      marcasValidas.push(nomeMarca);
    }
  }

  const celulaValidacao = abaCadastroPeca.getRange('C6');
  
  if (marcasValidas.length > 0) {
    const regra = SpreadsheetApp.newDataValidation().requireValueInList(marcasValidas, true).setAllowInvalid(false).build();

    celulaValidacao.setDataValidation(regra);
  } else {
    celulaValidacao.clearDataValidations()
  }
}

function editarMarca() {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  const abaConsultaMarca = planilha.getSheetByName('tab_marca');
  const abaCadastroMarca = planilha.getSheetByName('cadastro marca');
  const ultimaLinha = abaConsultaMarca.getLastRow();
  const data_alteracao = Utilities.formatDate(new Date(), "GMT-3", "dd/MM/yyyy")
  const ui = SpreadsheetApp.getUi();
  
  const nomeMarca = abaCadastroMarca.getRange('E4').getValue();

  if (nomeMarca == "") {
    ui.alert("ERRO", "Digite o nome da marca a ser editada.", ui.ButtonSet.OK);
    return;
  }

  if (ultimaLinha > 1) {
    const resposta = ui.prompt("Editando marca", "Digite o nome para atualizar '" + nomeMarca + "':", ui.ButtonSet.OK_CANCEL);
    if (resposta.getSelectedButton() === ui.Button.CANCEL){
      return;
    }

    // Usuário não pode deixar o campo em branco ou digitar somente espaços
    const nomeNovo = resposta.getResponseText().trim();
    if (nomeNovo == ""){
      ui.alert("AVISO", "Nome de marca não pode ser vazio", ui.ButtonSet.OK);
      return;
    }

    const listaMarcas = abaConsultaMarca.getRange(2, 2, ultimaLinha -1, 1).getValues();
    const marcaJaExiste = listaMarcas.some(linha => linha[0].toString().trim().toLowerCase() === nomeNovo.toString().trim().toLowerCase());

    if (marcaJaExiste) {
      ui.alert("AVISO", "Esta marca já está cadastrada no sistema.", ui.ButtonSet.OK);
      return;
    }

    let linhaLocalizada = -1;

    //Encontra a marca a ser editada
    for(i = 0; i < listaMarcas.length; i++) {
      const marcaPlanilha = listaMarcas[i][0].toString().trim().toLowerCase();
      const marcaBusca = nomeMarca.toString().trim().toLowerCase();

      if (marcaPlanilha === marcaBusca) {
        linhaLocalizada = i + 2;
        break;
      }
    }

    // Se a linha existir troca na tabela, se não, pode cadastrar
    if (linhaLocalizada !== -1) {
      abaConsultaMarca.getRange(linhaLocalizada, 2).setValue(nomeNovo);
      abaCadastroMarca.getRange('E4').clearContent();
      abaConsultaMarca.getRange(linhaLocalizada, 5).setValue(data_alteracao);
      ui.alert("SUCESSO", "Marca cadastrada com sucesso", ui.ButtonSet.OK);
    } else {
      ui.alert("AVISO", "Marca não encontrada.", ui.ButtonSet.OK);
    }

  } else{
    ui.alert("ERRO", "A tabela de marcas está vazia", ui.ButtonSet.OK);
  }
}

function botaoVoltarMarca() {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  const abaCadastroPeca = planilha.getSheetByName('cadastro peca');
  SpreadsheetApp.setActiveSheet(abaCadastroPeca);
}
