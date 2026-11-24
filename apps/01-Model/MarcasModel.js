let brandTableName = 'tbl_marca'
let firstLineBrands  = 3
let numColumnsBrands = 5

let brandIdCol = 0
let brandNameCol = 1
let brandDtCadastroCol = 2
let brandDtExclusaoCol = 3
let brandDtAlteracaoCol = 4

function ReadBrands() {

  const objRows = ReadSheet(brandTableName, firstLineBrands, numColumnsBrands)

  objRows.forEach( item => {
    item[brandDtCadastroCol] = isEmpty( item[brandDtCadastroCol] ) ? "" :  dateToString(item[brandDtCadastroCol])
    item[brandDtExclusaoCol] = isEmpty( item[brandDtExclusaoCol] ) ? "" :  dateToString(item[brandDtExclusaoCol])
    item[brandDtAlteracaoCol] = isEmpty( item[brandDtAlteracaoCol] ) ? "" : dateToString(item[brandDtAlteracaoCol])
  })
  
  return objRows
}

function  findBrandId(id) {
  
  return FindContext(brandTableName, id, firstLineBrands, numColumnsBrands)
}

function findBrand(columnName, context) {

  switch (columnName) {
    case 'id':
      return FindContext(brandTableName, context, firstLineBrands, brandIdCol)
    case 'name':
    case 'nome':
      return FindContext(brandTableName, context, firstLineBrands, brandNameCol)
      
    default:
      return false
  }

  return SearchContext(brandTableName, context, firstLineBrands, numColumnsBrands)
}

// Estava comentada (desativarMarca não existia de verdade -- ExcluirRegistro
// quebrava ao tentar excluir uma marca). Corrigido: brandDtAlteracaoCol/
// brandDtExclusaoCol são índices 0-based (pra ler array), getRange() pede
// coluna 1-based -- por isso o "+1" abaixo, que faltava.
function desativarMarca(idMarcaInput) {
  try {
    const idMarca = Number(idMarcaInput);

    if (!idMarca) {
      return { sucesso: false, mensagem: "ID da marca inválido." };
    }

    const planilha = SpreadsheetApp.getActiveSpreadsheet();
    const abaConsultaMarca = planilha.getSheetByName('tbl_marca');

    if (!abaConsultaMarca) {
      return { sucesso: false, mensagem: "Aba 'tbl_marca' não foi encontrada na planilha." };
    }

    const dadosMarcas = ReadBrands();
    let linhaLocalizada = -1;

    for (let i = 0; i < dadosMarcas.length; i++) {
      const idTabela = Number(dadosMarcas[i][brandIdCol]);
      const dataExclusaoTabela = dadosMarcas[i][brandDtExclusaoCol] ? dadosMarcas[i][brandDtExclusaoCol].toString().trim() : "";

      if (idTabela === idMarca && dataExclusaoTabela === "") {
        linhaLocalizada = i + firstLineBrands;
        break;
      }
    }

    if (linhaLocalizada === -1) {
      return { sucesso: false, mensagem: "Marca não encontrada (ou já desativada)." };
    }

    const dataExclusao = Utilities.formatDate(new Date(), "GMT-3", "dd/MM/yyyy");

    abaConsultaMarca.getRange(linhaLocalizada, brandDtExclusaoCol + 1).setValue(dataExclusao);
    abaConsultaMarca.getRange(linhaLocalizada, brandDtAlteracaoCol + 1).setValue(dataExclusao);
    abaConsultaMarca.getRange(linhaLocalizada, 1, 1, numColumnsBrands).setBackground("#F4CCCC");

    return { sucesso: true, mensagem: "Marca desativada com sucesso." };
  } catch (e) {
    return { sucesso: false, mensagem: "Erro no servidor: " + e.message };
  }
}

/** Reativa uma marca desativada: limpa DT_EXCLUSAO, atualiza DT_ALTERACAO. */
function reativarMarca(idMarcaInput) {
  try {
    const idMarca = Number(idMarcaInput);
    if (!idMarca) {
      return { sucesso: false, mensagem: "ID da marca inválido." };
    }

    const planilha = SpreadsheetApp.getActiveSpreadsheet();
    const abaConsultaMarca = planilha.getSheetByName('tbl_marca');
    if (!abaConsultaMarca) {
      return { sucesso: false, mensagem: "Aba 'tbl_marca' não foi encontrada na planilha." };
    }

    const dadosMarcas = ReadBrands();
    const idx = dadosMarcas.findIndex(l => Number(l[brandIdCol]) === idMarca);
    if (idx === -1) {
      return { sucesso: false, mensagem: "Marca não encontrada." };
    }

    const linhaReal = idx + firstLineBrands;
    const dataAtual = Utilities.formatDate(new Date(), "GMT-3", "dd/MM/yyyy");

    abaConsultaMarca.getRange(linhaReal, brandDtExclusaoCol + 1).clearContent();
    abaConsultaMarca.getRange(linhaReal, brandDtAlteracaoCol + 1).setValue(dataAtual);
    abaConsultaMarca.getRange(linhaReal, 1, 1, numColumnsBrands).setBackground("#FFFFFF");

    return { sucesso: true, mensagem: "Marca reativada com sucesso." };
  } catch (e) {
    return { sucesso: false, mensagem: "Erro no servidor: " + e.message };
  }
}