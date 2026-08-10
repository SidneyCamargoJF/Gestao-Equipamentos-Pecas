function ConsultaPecasHtml() {
  return HtmlService.createHtmlOutputFromFile('ConsultaPecasForm').getContent();
}

function showPecas() {
  const form = HtmlService.createTemplateFromFile("ConsultaPecasForm");
  const showForm = form.evaluate().setSandboxMode(HtmlService.SandboxMode.IFRAME);
  showForm.setTitle("Consulta de Peças").setHeight(900).setWidth(1600);

  SpreadsheetApp.getUi().showModalDialog(showForm, "Consulta de Peças");
}

function FiltrarPecas(criterios) {
  let dados = ReadParts();
  if (!dados || dados.length === 0) return "NoData";

  criterios = criterios || {};
  let cNomeFiltro        = String(criterios.nome || '').trim().toLowerCase();
  let cMarcaFiltro       = String(criterios.marca || '').trim().toLowerCase();
  let cLocalizacaoFiltro = String(criterios.localizacao || '').trim().toLowerCase();
  let cFornecedorFiltro  = String(criterios.fornecedor || '').trim().toLowerCase();
  let cGarantiaFiltro    = String(criterios.garantia || '').trim().toLowerCase();

  let res = [];

  // Pula o cabeçalho (linha 0) se a primeira célula contiver "id" ou palavra similar
  let inicio = (dados.length > 0 && String(dados[0][0]).toLowerCase().includes('id')) ? 1 : 0;

  for (let l = inicio; l < dados.length; l++) {
    // Leitura segura com tratamento contra null/undefined
    let colNome        = String(dados[l][1] || '').trim().toLowerCase();
    let colMarca       = String(dados[l][2] || '').trim().toLowerCase();
    let colLocalizacao = String(dados[l][6] || '').trim().toLowerCase();
    let colFornecedor  = String(dados[l][7] || '').trim().toLowerCase();
    let colGarantia    = String(dados[l][11] || '').trim().toLowerCase();

    // Comparações com operador lógico ||
    let cNome        = (cNomeFiltro === ""        || colNome.includes(cNomeFiltro));
    let cMarca       = (cMarcaFiltro === ""       || colMarca.includes(cMarcaFiltro));
    let cLocalizacao = (cLocalizacaoFiltro === "" || colLocalizacao.includes(cLocalizacaoFiltro));
    let cFornecedor  = (cFornecedorFiltro === ""  || colFornecedor.includes(cFornecedorFiltro));
    let cGarantia    = (cGarantiaFiltro === ""    || colGarantia.includes(cGarantiaFiltro));

    if (cNome && cMarca && cLocalizacao && cFornecedor && cGarantia) {
      // A célula pode vir como Date (formatação de data na planilha) ou como texto (ex: input HTML) --
      // calculaDias() exige um Date de verdade, por isso normalizamos antes de usar.
      let dtGarantiaRaw = dados[l][partsDtGarantiaCol];
      let dtGarantiaData = dtGarantiaRaw instanceof Date
        ? dtGarantiaRaw
        : (dtGarantiaRaw ? stringToDate(String(dtGarantiaRaw)) : null);
      let dtGarantiaValida = dtGarantiaData && !isNaN(dtGarantiaData);

      let diasGarantia = (typeof calculaDias === 'function' && dtGarantiaValida)
        ? calculaDias(dtGarantiaData, new Date())
        : 0;

      let objRes = {
        id: dados[l][partsIdCol],
        nome: dados[l][partsNameCol],
        marca: dados[l][partsBrandCol],
        modelo: dados[l][partsModelCol],
        fornecedor: dados[l][partsSuplierCol],
        localizacao: dados[l][partsLocalCol],
        garantia: (typeof statusGarantia === 'function') ? statusGarantia(diasGarantia) : colGarantia,
        dt_garantia: (typeof dateToString === 'function' && dtGarantiaValida) ? dateToString(dtGarantiaData) : dtGarantiaRaw,
        dias_garantia: diasGarantia,
        valor: dados[l][partsValueCol],
        sei_num: dados[l][partsSEINumCol]
      };

      res.push(objRes);
    }
  }

  if (res.length === 0) {
    return "NoData";
  }

  return res;
}