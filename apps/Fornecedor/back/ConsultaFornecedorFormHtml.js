function showFornecedor() {
  const form = HtmlService.createTemplateFromFile("ConsultaFornecedorForm");
  const showForm = form.evaluate().setSandboxMode(HtmlService.SandboxMode.IFRAME);
  showForm.setTitle("Consulta de Fornecedor").setHeight(900).setWidth(1400);
  SpreadsheetApp.getUi().showModalDialog(showForm, "Consulta de Fornecedor");
}

function filtrarFornecedores(criterios) {
  let dados = ReadSuppliers();
  let res = [];

  let cnpjBuscado = (criterios && criterios.cnpj) ? String(criterios.cnpj).replace(/\D/g, '') : "";
  let razaoBuscada = (criterios && criterios.razaoSocial) ? String(criterios.razaoSocial).trim().toLowerCase() : "";
  let fantasiaBuscada = (criterios && criterios.nomeFantasia) ? String(criterios.nomeFantasia).trim().toLowerCase() : "";
  let cidadeBuscada = (criterios && criterios.cidade) ? String(criterios.cidade).trim().toLowerCase() : "";

  for (let i = 0; i < dados.length; i++) {
    let colCNPJ = String(dados[i][3] || '').replace(/\D/g, '');
    let colRazaoSocial = String(dados[i][1] || '').trim().toLowerCase();
    let colNomeFantasia = String(dados[i][2] || '').trim().toLowerCase();
    let colCidade = String(dados[i][14] || '').trim().toLowerCase();

    let cCNPJ     = (cnpjBuscado === ""     || colCNPJ.includes(cnpjBuscado));
    let cRazao    = (razaoBuscada === ""    || colRazaoSocial.includes(razaoBuscada));
    let cFantasia = (fantasiaBuscada === "" || colNomeFantasia.includes(fantasiaBuscada));
    let cCidade   = (cidadeBuscada === ""   || colCidade.includes(cidadeBuscada));

    if(cCNPJ && cRazao && cFantasia && cCidade) {
      res.push({
        id: dados[i][0], 
        cnpj: dados[i][3], 
        razaoSocial: dados[i][1],
        nomeFantasia: dados[i][2],
        cidade: dados[i][14]
      });
    }
  }
  return res;
}
