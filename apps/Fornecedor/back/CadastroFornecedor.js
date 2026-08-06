function salvarFornecedor() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  // Assume que o formulário está na aba ativa
  const abaFormulario = ss.getActiveSheet(); 

  const razaoSocial = abaFormulario.getRange('G3:H3').getValue();
  const nomeFantasia = abaFormulario.getRange('C5:D5').getValue();
  let cnpj = abaFormulario.getRange('C3:D3').getValue();
  const inscricaoEstadual = abaFormulario.getRange('G5:H5').getValue();
  const inscricaoMunicipal = abaFormulario.getRange('C7:D7').getValue();
  const email = abaFormulario.getRange('G7:H7').getValue();
  const telefoneFixo = abaFormulario.getRange('C9:D9').getValue();
  const telefoneCelular = abaFormulario.getRange('C11:D11').getValue();
  const whatsapp = abaFormulario.getRange('G11:H11').getValue();
  let cep = abaFormulario.getRange('C15:D15').getValue();
  const ruaAvenida = abaFormulario.getRange('G15:H15').getValue();
  const numero = abaFormulario.getRange('C17:D17').getValue();
  const bairro = abaFormulario.getRange('G17:H17').getValue();
  const cidade = abaFormulario.getRange('C19:D19').getValue();
  const estado = abaFormulario.getRange('G19:H19').getValue();
  const complemento = abaFormulario.getRange('C21:D21').getValue();
  
  const dataAtual = Utilities.formatDate(new Date(), "GMT-3", "dd/MM/yyyy");
  const status = "Ativo";

  // Validação de campos obrigatórios
  if (!razaoSocial || !nomeFantasia || !cnpj || !inscricaoEstadual || !inscricaoMunicipal || !cep || !ruaAvenida || !numero || !bairro || !cidade || !estado){
    SpreadsheetApp.getUi().alert("ERRO: Faltam dados obrigatórios.");
    return;
  }

  // Limpeza de formatação
  cep = cep.toString().replace(/\D/g, '');
  cnpj = cnpj.toString().trim();

  // Acessa a tabela de banco de dados
  const abaTabelaFornecedor = ss.getSheetByName(supplierTableName);
  const dadosTabela = abaTabelaFornecedor.getDataRange().getValues();
  
  let linhaDestino = -1;

  // Busca se o CNPJ já existe na Coluna D (índice 3 da matriz)
  for (let i = 1; i < dadosTabela.length; i++) {
    if (dadosTabela[i][3].toString().trim() === cnpj) {
      linhaDestino = i + 1; // Linha real encontrada para EDIÇÃO
      break;
    }
  }

  if (linhaDestino !== -1) {
    // === MODO EDIÇÃO ===
    
    // Monta o array exatamente na ordem das suas 20 colunas (A até T)
    // Buscamos o ID existente para não alterá-lo e a Data de Cadastro original
    const idExistente = dadosTabela[linhaDestino - 1][0];
    const dataCadastroOriginal = dadosTabela[linhaDestino - 1][17];

    const dadosAtualizados = [
      idExistente, razaoSocial, nomeFantasia, cnpj, inscricaoEstadual, 
      inscricaoMunicipal, email, telefoneFixo, telefoneCelular, whatsapp, 
      cep, ruaAvenida, numero, bairro, cidade, 
      estado, complemento, dataCadastroOriginal, dataAtual, status
    ];

    // Salva por cima da linha existente
    abaTabelaFornecedor.getRange(linhaDestino, 1, 1, 20).setValues([dadosAtualizados]);
    SpreadsheetApp.getUi().alert("Fornecedor ATUALIZADO com sucesso!");

  } else {
    // MODO CRIAÇÃO
    const ultima_linha = abaTabelaFornecedor.getLastRow();
    let novoId = abaTabelaFornecedor.getRange(ultima_linha, 1).getValue();
    
    if (novoId == "ID" || novoId == "") {
      novoId = 0;
    }
    novoId = Number(novoId) + 1;

    const novosDados = [
      novoId, razaoSocial, nomeFantasia, cnpj, inscricaoEstadual, 
      inscricaoMunicipal, email, telefoneFixo, telefoneCelular, whatsapp, 
      cep, ruaAvenida, numero, bairro, cidade, 
      estado, complemento, dataAtual, "", status
    ];

    // Grava a nova linha de uma vez só (evita o loop `for` deixando o script muito mais rápido)
    abaTabelaFornecedor.getRange(ultima_linha + 1, 1, 1, 20).setValues([novosDados]);
    SpreadsheetApp.getUi().alert("Fornecedor CADASTRADO com sucesso!");
  }

  // Limpa o formulário após salvar (Independente se criou ou editou)
  for (let linha = 3; linha <= 21; linha += 2) {
    abaFormulario.getRange(`C${linha}:D${linha}`).clearContent();
    abaFormulario.getRange(`G${linha}:H${linha}`).clearContent();
  }
}


function preencherWhatsapp(aba, valor, linha, coluna) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const abaCadastroFornecedor = ss.getSheetByName('cadastro fornecedor');
  
  if ((linha === 11) && (coluna === 3 || coluna === 4) && aba.getName() == 'cadastro fornecedor') {
    
    if (!valor) return;

    abaCadastroFornecedor.getRange('G11:H11').setValue(valor);
  }

}


function verificarCnpj(aba, celula, valor, linha, coluna) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const abaCadastroFornecedor = 'cadastro fornecedor';
  const abaAtiva = celula.getSheet();
  
  if (linha === 3 && (coluna === 3 || coluna === 4) && aba.getName() === abaCadastroFornecedor) {

    const sx = ss.getSheetByName(supplierTableName);
    const abaCadastroFornecedor = ss.getSheetByName('cadastro fornecedor');

    if (/^[0-9]+$/.test(valor)) {
      abaAtiva.getRange("C3:D3").setNumberFormat('00"."000"."000"/"0000"-"00');
    } 
    
    const valorString = valor.toString().trim();

    if (valor === "") return;

    // Limpa o texto mantendo apenas letras e números E adiciona os zeros para a verificação
    let cnpjLimpo = valorString.replace(/[^A-Za-z0-9]/g, "").toUpperCase().padStart(14,0);

    if (cnpjLimpo.length === 14){

      // Aplica a máscara textual adequada (compatível com números e letras)
      const cnpjFormatado = cnpjLimpo.replace(
        /^([A-Z0-9]{2})([A-Z0-9]{3})([A-Z0-9]{3})([A-Z0-9]{4})([0-9]{2})$/, 
        "$1.$2.$3/$4-$5"
      );

      abaCadastroFornecedor.getRange('C3:D3').setValue(cnpjFormatado);

      let valoresDaColuna = sx.getRange('D2:D' + sx.getLastRow()).getValues().flat();
      let colunaSet = new Set(valoresDaColuna);

      if (colunaSet.has(cnpjFormatado)) {
        const ui = SpreadsheetApp.getUi();
        const resposta = ui.alert("AVISO DE CADASTRO", "ERRO: Já existe um fornecedor com esse CNPJ. Gostaria de editá-lo?", SpreadsheetApp.getUi().ButtonSet.YES_NO);

        if (resposta == ui.Button.YES){
          buscarFornecedorPorCnpj();
        }
        else {
        SpreadsheetApp.getUi().alert("Continuando com o cadastro. Coloque um CNPJ novo para cadastrá-lo.");

        }
      }

    } else {
      SpreadsheetApp.getUi().alert("Atenção: O CNPJ digitado não possui 14 caracteres. Verifique o valor inserido.");
      return;
    }

    
  }
}

function buscarFornecedorPorCnpj() {

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var cnpj = ss.getRange('C3:D3').getValue();

  const sx = ss.getSheetByName(supplierTableName)

  var ultimaLinha = sx.getLastRow();
  var dadosFornecedor = sx.getRange(2, 2, ultimaLinha - 1, 17).getValues();

  var dados = [];
  for (let i = 0; i < dadosFornecedor.length; i++){
    if (dadosFornecedor[i][2] == cnpj){

      for (let y = 0; y < 17 ; y++){
        dados.push(dadosFornecedor[i][y]);
      }

      break
    }
  }
  
  const sc = ss.getSheetByName('cadastro fornecedor');

  sc.getRange('C3:D3').setValue(dados[2]); // CNPJ
  sc.getRange('G3:H3').setValue(dados[0]); // Razão Social
  sc.getRange('C5:D5').setValue(dados[1]); // Nome fantasia
  sc.getRange('G5:H5').setValue(dados[3]); // inscrição estadual
  sc.getRange('C7:D7').setValue(dados[4]); // inscrição municipal
  sc.getRange('G7:H7').setValue(dados[5]); // E-mail
  sc.getRange('C9:D9').setValue(dados[6]); // Telefone fixo
  sc.getRange('C11:D11').setValue(dados[7]); // Telefone celular
  sc.getRange('G11:H11').setValue(dados[8]); // Whatsapp
  sc.getRange('C15:D15').setValue(dados[9]); // CEP
  sc.getRange('G15:H15').setValue(dados[10]); // Rua/Avenida
  sc.getRange('C17:D17').setValue(dados[11]); // Número
  sc.getRange('G17:H17').setValue(dados[12]); // Bairro
  sc.getRange('C19:D19').setValue(dados[13]); // Cidade
  sc.getRange('G19:H19').setValue(dados[14]); // Estado
  sc.getRange('C21:D21').setValue(dados[15]); // Complemento

}


function verificarEmail(aba, valor, linha, coluna){

  if ((linha === 7) && (coluna === 7 || coluna === 8) && aba.getName() === 'cadastro fornecedor') {

    if (!valor) return;

    const regex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;

    const resultado = regex.test(valor);

    if (!resultado){
      SpreadsheetApp.getUi().alert('E-mail inválido. Digite um e-mail válido.');
    }
  }

}

function preencherWhatsapp(aba, valor, linha, coluna) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const abaCadastroFornecedor = ss.getSheetByName('cadastro fornecedor');
  
  if ((linha === 11) && (coluna === 3 || coluna === 4) && aba.getName() == 'cadastro fornecedor') {
    
    if (!valor) return;

    abaCadastroFornecedor.getRange('G11:H11').setValue(valor);
  }

}

