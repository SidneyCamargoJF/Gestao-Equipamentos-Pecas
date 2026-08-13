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

  let inicio = (dados.length > 0 && String(dados[0][0]).toLowerCase().includes('id')) ? 1 : 0;

  for (let l = inicio; l < dados.length; l++) {
    let colNome        = String(dados[l][1] || '').trim().toLowerCase();
    let colMarca       = String(dados[l][2] || '').trim().toLowerCase();
    let colLocalizacao = String(dados[l][6] || '').trim().toLowerCase();
    let colFornecedor  = String(dados[l][7] || '').trim().toLowerCase();


    let dtGarantiaRaw = dados[l][partsDtGarantiaCol];
    let dtGarantiaData = dtGarantiaRaw instanceof Date
      ? dtGarantiaRaw
      : (dtGarantiaRaw ? stringToDate(String(dtGarantiaRaw)) : null);
    let dtGarantiaValida = dtGarantiaData && !isNaN(dtGarantiaData);

    let diasGarantia = (typeof calculaDias === 'function' && dtGarantiaValida)
      ? calculaDias(dtGarantiaData, new Date())
      : 0;

    let garantiaStatus = (typeof statusGarantia === 'function') ? statusGarantia(diasGarantia) : '';
    let colGarantia = String(garantiaStatus || '').trim().toLowerCase();

    let cNome        = (cNomeFiltro === ""        || colNome.includes(cNomeFiltro));
    let cMarca       = (cMarcaFiltro === ""       || colMarca.includes(cMarcaFiltro));
    let cLocalizacao = (cLocalizacaoFiltro === "" || colLocalizacao.includes(cLocalizacaoFiltro));
    let cFornecedor  = (cFornecedorFiltro === ""  || colFornecedor.includes(cFornecedorFiltro));
    let cGarantia    = (cGarantiaFiltro === ""    || colGarantia === cGarantiaFiltro);

    if (cNome && cMarca && cLocalizacao && cFornecedor && cGarantia) {
      let dtGarantiaTexto = '';
      if (dtGarantiaValida && typeof dateToString === 'function') {
        dtGarantiaTexto = dateToString(dtGarantiaData);
      } else if (dtGarantiaRaw && !(dtGarantiaRaw instanceof Date)) {
        dtGarantiaTexto = String(dtGarantiaRaw);
      }

      let objRes = {
        id: dados[l][partsIdCol],
        nome: String(dados[l][partsNameCol] || ''),
        marca: String(dados[l][partsBrandCol] || ''),
        modelo: String(dados[l][partsModelCol] || ''),
        fornecedor: String(dados[l][partsSuplierCol] || ''),
        localizacao: String(dados[l][partsLocalCol] || ''),
        garantia: garantiaStatus,
        dt_garantia: dtGarantiaTexto,
        dias_garantia: diasGarantia,
        valor: dados[l][partsValueCol],
        sei_num: String(dados[l][partsSEINumCol] || '')
      };

      res.push(objRes);
    }
  }

  if (res.length === 0) {
    return "NoData";
  }

  return res;
}