function ConsultaPecasHtml() {
    return HtmlService.createHtmlOutputFromFile('ConsultaPecasForm').getContent();
}

function showPecas() {
  const form = HtmlService.createTemplateFromFile("ConsultaPecasForm");

  const showForm = form.evaluate().setSandboxMode(HtmlService.SandboxMode.IFRAME);

  showForm.setTitle("Consulta de Peças").setHeight(900).setWidth(1600)

  Logger.log('Tela')

  SpreadsheetApp.getUi().showModalDialog(showForm, "Consulta de Peças")
}

function FiltrarPecas(criterios) {

  let dados = ReadParts()

  const dataAtual = new Date();

  let res = [];

  for (l = 0; l < dados.length -1; l++) {
    let colNome        = String(dados[l][1]).trim().toLowerCase();

    // Ler tabela de marcas para comparação
    // letColMarca     = FindBrand('nome ou codigo da marca)
    let colMarca       = String(dados[l][2]).trim().toLowerCase();

    // Ler tabela de Localização para comparação
    // letColLocalizacao  = FindLocalizacao('nome ou codigo da localização)
    let colLocalizacao = String(dados[l][6]).trim().toLowerCase();

    // Ler tabela de Fornecedor para comparação
    // letColFornecedor  = FindFornecedor('nome ou codigo do fornecedor) 
    let colFornecedor  = String(dados[l][7]).trim().toLowerCase();

    let colGarantia    = String(dados[l][11]).trim().toLowerCase();

    let cNome        = (criterios.nome === "" | colNome.includes(criterios.nome))
    let cMarca       = (criterios.marca === "" | colMarca.includes(criterios.marca))
    let cLocalizacao = (criterios.localizacao === "" | colLocalizacao.includes(criterios.localizacao))
    let cFornecedor  = (criterios.fornecedor === "" | colFornecedor.includes(criterios.fornecedor))
    let cGarantia    = (criterios.garantia === "" | colGarantia.includes(criterios.garantia))

    if(cNome && cMarca && cLocalizacao && cFornecedor && cGarantia) {

      diasGarantia = calculaDias(dados[l][partsDtGarantiaCol], new Date())
      // diasGarantia = 10

      objRes = {
        id: dados[l][partsIdCol],
        nome: dados[l][partsNameCol],
        marca: dados[l][partsBrandCol],
        modelo: dados[l][partsModelCol],
        fornecedor: dados[l][partsSuplierCol],
        localizacao: dados[l][partsLocalCol],
        garantia: statusGarantia(diasGarantia),
        dt_garantia: dateToString(dados[l][partsDtGarantiaCol]),
        dias_garantia: diasGarantia,
        valor: dados[l][partsValueCol],
        sei_num: dados[l][partsSEINumCol]
      }

      res.push(objRes);
    }
  }

  if (res.length === 0) {
    return "NoData"
  }

  return res
   
}


