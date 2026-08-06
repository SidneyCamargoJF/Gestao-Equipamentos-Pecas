function consultarFornecedor() {
  const planilha = SpreadsheetApp.getActive();
  const abaConsultarFornecedor = planilha.getSheetByName("consulta fornecedor");
  const abaTabelaFornecedor = planilha.getSheetByName(supplierTableName);

  SpreadsheetApp.flush();

  // Lê os inputs do usuário
  const cnpj = abaConsultarFornecedor.getRange("C2:D2").getValue();
  const razaoSocial = abaConsultarFornecedor.getRange("C4:D4").getValue();
  const nomeFantasia = abaConsultarFornecedor.getRange("C6:D6").getValue();
  const inscricaoEstadual = abaConsultarFornecedor.getRange("C8:D8").getValue();
  const inscricaoMunicipal = abaConsultarFornecedor.getRange("C10:D10").getValue();
  const email = abaConsultarFornecedor.getRange("C8:D8").getValue();
  const telefoneFixo = abaConsultarFornecedor.getRange("G2:H2").getValue();
  const telefoneCelular = abaConsultarFornecedor.getRange("G4:H4").getValue();
  const whatsapp = abaConsultarFornecedor.getRange("G6:H6").getValue();
  const cep = abaConsultarFornecedor.getRange("G8:H8").getValue();
  const ruaAvenida = abaConsultarFornecedor.getRange("G10:H10").getValue();
  const numero = abaConsultarFornecedor.getRange("K2:L2").getValue();
  const bairro = abaConsultarFornecedor.getRange("K4:L4").getValue();
  const cidade = abaConsultarFornecedor.getRange("K6:L6").getValue();
  const estado = abaConsultarFornecedor.getRange("K8:L8").getValue();
  const complemento = abaConsultarFornecedor.getRange("K10:L10").getValue();

  // Padroniza os inputs para letras minúsculas e remove espaços extras
  const sCnpj = String(cnpj).trim().toLowerCase();
  const sRazaoSocial = String(razaoSocial).trim().toLowerCase();
  const sNomeFantasia = String(nomeFantasia).trim().toLowerCase();
  const sInscricaoEstadual = String(inscricaoEstadual).trim().toLowerCase();
  const sInscricaoMunicipal = String(inscricaoMunicipal).trim().toLowerCase();
  const sEmail = String(email).trim().toLowerCase();
  const sTelefoneFixo = String(telefoneFixo).trim().toLowerCase();
  const sTelefoneCelular = String(telefoneCelular).trim().toLowerCase();
  const sWhatsapp = String(whatsapp).trim().toLowerCase();
  const sCep = String(cep).trim().toLowerCase();
  const sRuaAvenida = String(ruaAvenida).trim().toLowerCase();
  const sNumero = String(numero).trim().toLowerCase();
  const sBairro = String(bairro).trim().toLowerCase();
  const sCidade = String(cidade).trim().toLowerCase();
  const sEstado = String(estado).trim().toLowerCase();
  const sComplemento = String(complemento).trim().toLowerCase();


  const ultimaLinha = abaTabelaFornecedor.getLastRow();

  const todosDados = abaTabelaFornecedor.getRange(2, 2, ultimaLinha - 1, 16).getValues();
  let fornecedorDados = []

  for (let linha = 0; linha < todosDados.length; linha++){

    //Padroniza os dados do banco para letras minúsculas e remove espaços extras
    let tRazaoSocial = String(todosDados[linha][0]).trim().toLowerCase();
    let tNomeFantasia = String(todosDados[linha][1]).trim().toLowerCase();
    let tCnpj = String(todosDados[linha][2]).trim().toLowerCase();
    let tInscricaoEstadual = String(todosDados[linha][3]).trim().toLowerCase();
    let tInscricaoMunicipal = String(todosDados[linha][4]).trim().toLowerCase();
    let tEmail = String(todosDados[linha][5]).trim().toLowerCase();
    let tTelefoneFixo = String(todosDados[linha][6]).trim().toLowerCase();
    let tTelefoneCelular = String(todosDados[linha][7]).trim().toLowerCase();
    let tWhatsapp = String(todosDados[linha][8]).trim().toLowerCase();
    let tCep = String(todosDados[linha][9]).trim().toLowerCase();
    let tRuaAvenida = String(todosDados[linha][10]).trim().toLowerCase();
    let tNumero = String(todosDados[linha][11]).trim().toLowerCase();
    let tBairro = String(todosDados[linha][12]).trim().toLowerCase();
    let tCidade = String(todosDados[linha][13]).trim().toLowerCase();
    let tEstado = String(todosDados[linha][14]).trim().toLowerCase();
    let tComplemento = String(todosDados[linha][15]).trim().toLowerCase();


    let condicao1 = (sRazaoSocial === "" || tRazaoSocial == sRazaoSocial);
    let condicao2 = (sNomeFantasia === "" || tNomeFantasia == sNomeFantasia);
    let condicao3 = (sCnpj === "" || tCnpj == sCnpj);
    let condicao4 = (sInscricaoEstadual === "" || tInscricaoEstadual == sInscricaoEstadual);
    let condicao5 = (sInscricaoMunicipal === "" || tInscricaoMunicipal == sInscricaoMunicipal);
    let condicao6 = (sEmail === "" || tEmail == sEmail);
    let condicao7 = (sTelefoneFixo === "" || tTelefoneFixo == sTelefoneFixo);
    let condicao8 = (sTelefoneCelular === "" || tTelefoneCelular == sTelefoneCelular);
    let condicao9 = (sWhatsapp === "" || tWhatsapp == sWhatsapp);
    let condicao10 = (sCep === "" || tCep == sCep);
    let condicao11 = (sRuaAvenida === "" || tRuaAvenida == sRuaAvenida);
    let condicao12 = (sNumero === "" || tNumero == sNumero);
    let condicao13 = (sBairro === "" || tBairro == sBairro);
    let condicao14 = (sCidade === "" || tCidade == sCidade);
    let condicao15 = (sEstado === "" || tEstado == sEstado);
    let condicao16 = (sComplemento === "" || tComplemento == sComplemento);

    if (condicao1 && condicao2 && condicao3 && condicao4 && condicao5 && condicao6 && condicao7 && condicao8 && condicao9 && condicao10 && condicao11 && condicao12 && condicao13 && condicao14 && condicao15 && condicao16){
      fornecedorDados.push(todosDados[linha]);
    }

  }

  const intervaloExibicao = abaConsultarFornecedor.getRange("B20:Q");

  intervaloExibicao.clearContent();

  if (fornecedorDados.length > 0) {
    abaConsultarFornecedor.getRange(20, 2, fornecedorDados.length, 16).setValues(fornecedorDados);
  }
  else {
    SpreadsheetApp.getUi().alert("Peça não encontrada");
  }

}

function redirecionarEdicaoFornecedor(dados) {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  const abaCadastro = planilha.getSheetByName('cadastro fornecedor');
  SpreadsheetApp.setActiveSheet(abaCadastro);

  //Indicador de edição
  abaCadastro.getRange("Z1").setValue(dados[supplierCNPJCol]); 

  abaCadastro.getRange("C3").setValue(dados[supplierCNPJCol]); //CNPJ
  abaCadastro.getRange("G3").setValue(dados[supplierRazaoSocialCol]); // Razão Social
  abaCadastro.getRange("C5").setValue(dados[supplierNameCol]); // Nome Fantasia 
  abaCadastro.getRange("G5").setValue(dados[supplierInscEstadualCol]); // Inscrição Estadual
  abaCadastro.getRange("C7").setValue(dados[supplierInscMunicipalCol]); // Inscrção Municipal
  abaCadastro.getRange("G7").setValue(dados[supplierEmailCol]); // Email
  abaCadastro.getRange("C9").setValue(dados[supplierTelefoneCol]); // Telefone Fixo
  abaCadastro.getRange("C11").setValue(dados[supplierCelularCol]); // Telefone Celular
  abaCadastro.getRange("G11").setValue(dados[supplierWhatsappCol]); // Whatsapp
  abaCadastro.getRange("C15").setValue(dados[supplierCEPCol]); // Cep
  abaCadastro.getRange("G15").setValue(dados[supplierLogradouroCol]); // Rua/Avenida
  abaCadastro.getRange("C17").setValue(dados[supplierNumeroCol]); // Número
  abaCadastro.getRange("G17").setValue(dados[supplierBairroCol]); // Bairro
  abaCadastro.getRange("C19").setValue(dados[supplierCidadeCol]); // Cidade
  abaCadastro.getRange("G19").setValue(dados[supplierEstadoCol]); // Estado
  abaCadastro.getRange("C21").setValue(dados[supplierComplementoCol]); // Complemento

}

function modoEdicaoFornecedor(ativar) {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  const abaEdicao = planilha.getSheetByName('cadastro fornecedor');
  
  if (ativar === true) {
    abaEdicao.getRange("Z1").setValue(true);

  } else {
    abaEdicao.getRange("Z1").setValue(false);
  }
}


function validacaoConsultarParaEditarFornecedor(aba, celula, valor) {
  const abaConsultarFornecedor = "consulta fornecedor";
  const colunaDaCheckbox = 18;

  if (aba.getName() === abaConsultarFornecedor && celula.getColumn() === colunaDaCheckbox && valor === "TRUE") {
    const linhaSelecionada = celula.getRow();
    
    const dadosLinhaSelecionada = aba.getRange(linhaSelecionada, 2, 1, 16).getValues()[0];
        
    redirecionarEdicaoFornecedor(dadosLinhaSelecionada);
    modoEdicaoFornecedor(true);

    celula.setValue(false);
  }

}
