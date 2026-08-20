function showFornecedor() {
  const form = HtmlService.createTemplateFromFile("ConsultaFornecedorForm");
  const showForm = form.evaluate().setSandboxMode(HtmlService.SandboxMode.IFRAME);
  showForm.setTitle("Consulta de Fornecedor").setHeight(900).setWidth(1400);
  SpreadsheetApp.getUi().showModalDialog(showForm, "Consulta de Fornecedor");
}

function filtrarFornecedores(criterios) {
  Logger.log('📥 [filtrarFornecedores] criterios recebidos: ' + JSON.stringify(criterios));

  let dados = ReadSuppliers();
  Logger.log('📊 [filtrarFornecedores] ReadSuppliers() retornou ' + dados.length + ' linha(s) brutas da planilha');
  if (dados.length > 0) {
    Logger.log('📊 [filtrarFornecedores] Exemplo (primeira linha): ' + JSON.stringify(dados[0]));
    Logger.log('📊 [filtrarFornecedores] Exemplo (última linha): ' + JSON.stringify(dados[dados.length - 1]));
  }

  let res = [];

  let cnpjBuscado = (criterios && criterios.cnpj) ? String(criterios.cnpj).replace(/[^A-Za-z0-9]/g, '').toUpperCase() : "";
  let razaoBuscada = (criterios && criterios.razaoSocial) ? String(criterios.razaoSocial).trim().toLowerCase() : "";
  let fantasiaBuscada = (criterios && criterios.nomeFantasia) ? String(criterios.nomeFantasia).trim().toLowerCase() : "";
  let estadoBuscado = (criterios && criterios.estado) ? String(criterios.estado).trim().toLowerCase() : "";
  let cidadeBuscada = (criterios && criterios.cidade) ? String(criterios.cidade).trim().toLowerCase() : "";

  for (let i = 0; i < dados.length; i++) {
    let colCNPJ = String(dados[i][3] || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    let colRazaoSocial = String(dados[i][1] || '').trim().toLowerCase();
    let colNomeFantasia = String(dados[i][2] || '').trim().toLowerCase();
    let colEstado = String(dados[i][15] || '').trim().toLowerCase();
    let colCidade = String(dados[i][14] || '').trim().toLowerCase();
    let colStatus = String(dados[i][19] || '').trim().toLowerCase();
    let desativado = (colStatus === 'inativo');

    // Campo único de nome busca em Razão Social OU Nome Fantasia (o cliente manda
    // o mesmo texto digitado nos dois critérios) -- por isso é OR, não AND.
    let termoNomeBuscado = razaoBuscada || fantasiaBuscada;

    let cCNPJ  = (cnpjBuscado === ""       || colCNPJ.includes(cnpjBuscado));
    let cNome  = (termoNomeBuscado === ""  || colRazaoSocial.includes(termoNomeBuscado) || colNomeFantasia.includes(termoNomeBuscado));
    let cEstado = (estadoBuscado === ""    || colEstado.includes(estadoBuscado));
    let cCidade = (cidadeBuscada === ""    || colCidade.includes(cidadeBuscada));

    if(cCNPJ && cNome && cEstado && cCidade) {
      res.push({
        id: dados[i][0],
        cnpj: dados[i][3],
        razaoSocial: dados[i][1],
        nomeFantasia: dados[i][2],
        telefone: dados[i][7] || dados[i][8] || '',
        email: dados[i][6],
        estado: dados[i][15],
        cidade: dados[i][14],
        desativado: desativado
      });
    }
  }

  // Fornecedores desativados sempre por último na lista.
  res.sort((a, b) => (a.desativado ? 1 : 0) - (b.desativado ? 1 : 0));

  Logger.log('✅ [filtrarFornecedores] resultado final: ' + res.length + ' fornecedor(es) após o filtro');
  return res;
}

/**
 * Desativa (soft-delete) um fornecedor: marca a coluna Status como "Inativo",
 * grava a data de alteração e pinta a linha de vermelho na planilha -- mesmo
 * padrão usado em desativarPeca() (ConsultaPeca.js). Não remove a linha.
 * Retorna { sucesso: boolean, mensagem: string }
 */
function desativarFornecedor(idInput) {
  try {
    const idBuscado = Number(idInput);
    if (!idBuscado) {
      return { sucesso: false, mensagem: "ID do fornecedor inválido." };
    }

    const planilha = SpreadsheetApp.getActiveSpreadsheet();
    const abaTabelaFornecedor = planilha.getSheetByName(supplierTableName);
    if (!abaTabelaFornecedor) {
      return { sucesso: false, mensagem: "Aba 'tbl_fornecedor' não foi encontrada na planilha." };
    }

    const dados = ReadSuppliers();

    for (let i = 0; i < dados.length; i++) {
      if (Number(dados[i][0]) === idBuscado) {
        const linhaReal = i + firstLineSupplier;
        const dataAtual = Utilities.formatDate(new Date(), "GMT-3", "dd/MM/yyyy");

        abaTabelaFornecedor.getRange(linhaReal, supplierDtAlteracaoCol).setValue(dataAtual);
        abaTabelaFornecedor.getRange(linhaReal, supplierStatusCol).setValue("Inativo");
        abaTabelaFornecedor.getRange(linhaReal, 1, 1, numColumnsupplier).setBackground("#F4CCCC");

        return { sucesso: true, mensagem: "Fornecedor desativado com sucesso." };
      }
    }

    return { sucesso: false, mensagem: "Fornecedor não encontrado (ID " + idBuscado + ")." };
  } catch (e) {
    return { sucesso: false, mensagem: "Erro no servidor: " + e.message };
  }
}
