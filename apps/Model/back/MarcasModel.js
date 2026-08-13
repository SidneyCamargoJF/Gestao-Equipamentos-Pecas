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

function desativarMarca(idMarcaInput) {
  try {
    const idMarca = Number(idMarcaInput);

    if (!idMarca) {
      return { sucesso: false, mensagem: "ID da marca inválido." };
    }

    const planilha = SpreadsheetApp.getActiveSpreadsheet();
    const abaConsultaMarca = planilha.getSheetByName('tbl_marca');

    if (!abaConsultaMarca) {
      Logger.log("Aba 'tbl_marca' não foi encontrada na planilha.");    
      return;
    }

    const dadosMarcas = ReadBrands();
    let linhaLocalizada = -1;

    for (let i = 0; i <dadosMarcas.length; i ++) {
      const idTabela = Number(dadosMarcas[i][0]);
      const dataExclusaoTabela = dadosMarcas[i][3] ? dadosMarcas[i][3].toString().trim() : "";

      if(idTabela === idMarca && dataExclusaoTabela === "") {
        linhaLocalizada = i + firstLineBrands;
        break; 
      }
    }

    if (linhaLocalizada !== -1) {
      const dataExclusao = Utilities.formatDate(new Date(), "GMT-3", "dd/MM/yyyy");

      abaConsultaMarca.getRange(linhaLocalizada, brandDtAlteracaoCol).setValue(dataExclusao);
      abaConsultaMarca.getRange(linhaLocalizada, 1, 1, 4).setBackground("#F4CCCC");

      Logger.log("Marca ID " + idMarca + " desativada na linha " + linhaLocalizada);   
      return true

    } else {
      Logger.log("Marca ativa não encontrada para o ID: " + idMarca);
      return false

    }
  } catch (e) {
    Logger.log("Erro no servidor ao desativar marca: " + e.message);
    return false
    
  }
}