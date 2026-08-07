/**
 * Função obrigatória para servir o Web App HTML via requisição GET.
 */
function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('Gerenciador Web - Google Sheets')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Exemplo de função que insere dados recebidos do formulário HTML na planilha.
 */
function salvarDados(dados) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var aba = ss.getActiveSheet();
    
    // Adiciona uma nova linha com os dados recebidos do HTML
    aba.appendRow([new Date(), dados.nome, dados.email, dados.categoria]);
    
    return { sucesso: true, mensagem: "Dados salvos com sucesso na planilha!" };
  } catch (e) {
    return { sucesso: false, mensagem: "Erro ao salvar: " + e.message };
  }
}

/**
 * Exemplo de função para ler dados da planilha e enviar para a tela HTML.
 */
function buscarDadosPlanilha() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var aba = ss.getActiveSheet();
  var dados = aba.getDataRange().getValues();
  return dados;
}


function doGetx() {
  return HtmlService.createTemplateFromFile('DashboardHtml')
    .evaluate()
    .setTitle('Sistema de Gestão de Equipamentos')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
function onEditx(e) {

  let celula = e.range;
  celula.get

  let valorAntigo = e.oldValue
  let valorAtual = e.value;

  e.source.toast("você alterou o valor de " + valorAntigo + " para " + valorAtual)
}

 */

function onEdit(e) {
  const aba = e.source.getActiveSheet();
  const abaCadastrarMaterial = 'cadastro material';
  const celula = e.range;
  let linha = celula.getRow();
  let coluna = celula.getColumn();

  const valor = e.value;

  let valorAtual = parseInt(e.value);

  // Validação Consultar Material
  validacaoConsultarParaEditarMaterial(aba, celula, valor);
  validacaoConsultarParaEditarFornecedor(aba, celula, valor);

  // Validação no Cadastrar Material
  if (isNaN(valorAtual) && ((linha === 3 || linha === 13) && (coluna === 3 || coluna === 4) && aba.getName() === abaCadastrarMaterial)) {
    valorAtual = 0; 
    SpreadsheetApp.getUi().alert("AVISO DE CADASTRO", "ERRO: Você não digitou uma palavra. Digite um número para prosseguir.", SpreadsheetApp.getUi().ButtonSet.OK);
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();

  verificarCampoPatrimonio(ss, valorAtual, linha, coluna);

  verificarCampoSequencia(ss, valorAtual, linha, coluna);

  verificarCnpj(aba, celula, valor, linha, coluna);

  verificarEmail(aba, valor, linha, coluna);

  preencherWhatsapp(aba, valor, linha, coluna);

}

function validacaoConsultarParaEditarMaterial(aba, celula, valor) {
  const abaConsultarMaterial = "consulta material";
  const colunaDaCheckbox = 8;

  if (aba.getName() === abaConsultarMaterial && celula.getColumn() === colunaDaCheckbox && valor === "TRUE") {
    const linhaSelecionada = celula.getRow();
    
    const dadosLinhaSelecionada = aba.getRange(linhaSelecionada, 2, 1, 6).getValues()[0];
        
    redirecionarEdicao(dadosLinhaSelecionada);
    modoEdicao(true);

    celula.setValue(false);
  }

}




function executarAoEditar(e) {

  const nomeAbaFornecedor = "cadastro fornecedor";
  const colunaCep = 3;
  const linhaCep = 15;
  const range = e.range;
  const abaAtiva = range.getSheet();
  const nomeAbaAtual = abaAtiva.getName();
  const colunaEditada = range.getColumn();
  const linhaEditada = range.getRow();

  // VALIDAÇÃO: Executa APENAS na aba correta
  if (nomeAbaAtual !== nomeAbaFornecedor || colunaEditada !== colunaCep || linhaEditada < linhaCep) {
    //SpreadsheetApp.getUi().alert('Celula errada');
    return;
  }
  
  const cep = range.getValue().toString().replace(/\D/g, '');

  // Se o usuário apagar o CEP, o script limpa os campos de endereço
  if (!cep) {
    abaAtiva.getRange("G15:H15").clearContent();
    abaAtiva.getRange("G17:H17").clearContent();
    abaAtiva.getRange("C19:D19").clearContent();
    abaAtiva.getRange("G19:H19").clearContent();
    return;
  }

  // Se o CEP tiver o tamanho correto, faz a busca externa
  if (cep.length === 8) {

    abaAtiva.getRange(linhaEditada, colunaCep).setNumberFormat('00000"-"000');

    let dadosEndereco = null;

    try {
        SpreadsheetApp.getUi().alert('Tentando BrasilAPI');
        const urlBrasilApi =  'https://brasilapi.com.br/api/cep/v1/' + cep;
        const resposta = UrlFetchApp.fetch(urlBrasilApi, { muteHttpExceptions: true });

        if (resposta.getResponseCode() === 200) {
          const dados = JSON.parse(resposta.getContentText());
          dadosEndereco = {
            logradouro: dados.street || "",
            bairro: dados.neighborhood || "",
            localidade: dados.city || "",
            estado: dados.state || ""
          };
        } else if (resposta.getResponseCode() === 404) {
            SpreadsheetApp.getUi().alert("CEP não encontrado");
            return;
        }

      } catch (erroBrasilApi) {
        SpreadsheetApp.getUi().alert("BrasilAPI indisponível. Tentando API de backup... Erro: " + erroBrasilApi.toString());
        return;
      }

    if (!dadosEndereco) {
      try {
      SpreadsheetApp.getUi().alert('Tentando ViaCEP');
      const urlViaCep = 'https://viacep.com.br/ws/' + cep + '/json/';
      const resposta = UrlFetchApp.fetch(urlViaCep, {muteHttpExceptions: true});

      if (resposta.getResponseCode() === 200) {
        const dados = JSON.parse(resposta.getContentText());
        if (!dados.erro) {
          dadosEndereco = {
            logradouro: dados.logradouro,
            bairro: dados.bairro,
            localidade: dados.localidade,
            estado: dados.uf
          };
        }
      }
    } catch (erroViaCep) {
      SpreadsheetApp.getUi().alert("Ambas as APIs falharam: " + erroViaCep.toString());
      SpreadsheetApp.getUi().alert("Serviço instável, tente novamente");
      }
    }  
      
      abaAtiva.getRange("G15:H15").setValue(dadosEndereco.logradouro); // Rua / Avenida
      abaAtiva.getRange("G17:H17").setValue(dadosEndereco.bairro);     // Bairro
      abaAtiva.getRange("C19:D19").setValue(dadosEndereco.localidade); // Cidade
      abaAtiva.getRange("G19:H19").setValue(dadosEndereco.estado);  // Estado (Sigla)

  }
}



function loginEnter() {
  showPage('menu');
}

function showLogin() {
  showPage('login');
}

function showMateriais() {

  showPage('consulta material');
}


function showPage(parShowPage) {
  const ss = SpreadsheetApp.getActiveSpreadsheet()
  const page = ss.getSheetByName(parShowPage)

  ss.setActiveSheet(ss.getSheetByName(parShowPage))
}

function showAll() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var tabs = ss.getSheets()

  for (var i = 0; i< tabs.length; i++) {
    let tab = tabs[i]
    if (tab.isSheetHidden()) {
      tab.showSheet()
    }
  }
}

function hideOthers(visibleSheet){
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const tabs = ss.getSheets();
  ss.setActiveSheet(ss.getSheetByName(visibleSheet))

  tabs.forEach(
    function(tab) {
      if (tab.getName() === visibleSheet) {
        tab.showSheet()

      } else {
        tab.hideSheet();
      }
    }
  )
}


// Função auxiliar para renderizar HTMLs dentro do arquivo principal (Index)
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

