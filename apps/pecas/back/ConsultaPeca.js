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

      let valorDtExclusao = dados[l][partsDtExclusaoCol];
      let desativada = !!(valorDtExclusao && String(valorDtExclusao).trim() !== '');

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
        sei_num: String(dados[l][partsSEINumCol] || ''),
        desativada: desativada
      };

      res.push(objRes);
    }
  }

  if (res.length === 0) {
    return "NoData";
  }

  // Peças desativadas vão pro final da lista, mesmo padrão do filtrarMarcas.
  res.sort((a, b) => (a.desativada ? 1 : 0) - (b.desativada ? 1 : 0));

  return res;
}

/**
 * Desativa uma peça (não exclui de verdade -- marca a data de exclusão e
 * pinta a linha de vermelho, mesmo padrão do desativarMarca). Chamado pelo
 * botão de lixeira na Consulta de Peças.
 */
function desativarPeca(idInput) {
  try {
    const idBuscado = Number(idInput);
    if (!idBuscado) {
      return { sucesso: false, mensagem: "ID da peça inválido." };
    }

    const planilha = SpreadsheetApp.getActiveSpreadsheet();
    const abaRegistroPecas = planilha.getSheetByName("tbl_pecas");
    if (!abaRegistroPecas) {
      return { sucesso: false, mensagem: "Aba 'tbl_pecas' não foi encontrada na planilha." };
    }

    const dados = ReadParts();
    if (!dados) {
      return { sucesso: false, mensagem: "Peça não encontrada (ID " + idBuscado + ")." };
    }

    for (let i = 0; i < dados.length; i++) {
      if (Number(dados[i][partsIdCol]) === idBuscado) {
        const linhaReal = i + firstLineParts;
        const dataExclusao = Utilities.formatDate(new Date(), "GMT-3", "dd/MM/yyyy");

        abaRegistroPecas.getRange(linhaReal, partsDtExclusaoCol + 1).setValue(dataExclusao);
        abaRegistroPecas.getRange(linhaReal, 1, 1, numColumnsParts).setBackground("#F4CCCC");

        return { sucesso: true, mensagem: "Peça desativada com sucesso!" };
      }
    }

    return { sucesso: false, mensagem: "Peça não encontrada (ID " + idBuscado + ")." };
  } catch (e) {
    Logger.log("Erro ao desativar peça: " + e.message);
    return { sucesso: false, mensagem: "Erro no servidor: " + e.message };
  }
}