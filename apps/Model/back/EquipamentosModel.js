let equipTableName = 'tbl_marca'
let firstLineEquipments  = 3
let numColumnsEquipments = 5

let equipIdCol = 0
let equipNameCol = 1
let equipDtCadastroCol = 2
let equipDtExclusaoCol = 3
let equipDtAlteracaoCol = 4

function ReadEquipments() {

  const objRows = ReadSheet(equipTableName, firstLineEquipments, numColumnsEquipments)

  objRows.forEach( item => {
    item[equipDtCadastroCol] = isEmpty( item[equipDtCadastroCol] ) ? "" :  dateToString(item[equipDtCadastroCol])
    item[equipDtExclusaoCol] = isEmpty( item[equipDtExclusaoCol] ) ? "" :  dateToString(item[equipDtExclusaoCol])
    item[equipDtAlteracaoCol] = isEmpty( item[equipDtAlteracaoCol] ) ? "" : dateToString(item[equipDtAlteracaoCol])
  })
  
  return objRows
}

function  findEquipmentId(id) {
  
  return FindContext(equipTableName, id, firstLineEquipments, numColumnsEquipments)
}

function findEquipment(columnName, context) {

  switch (columnName) {
    case 'id':
      return FindContext(equipTableName, context, firstLineEquipments, equipIdCol)
    case 'name':
    case 'nome':
      return FindContext(equipTableName, context, firstLineEquipments, equipNameCol)
      
    default:
      return false
  }

  return SearchContext(equipTableName, context, firstLineEquipments, numColumnsEquipments)
}

/*
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

    const dadosMarcas = ReadEquipments();
    let linhaLocalizada = -1;

    for (let i = 0; i <dadosMarcas.length; i ++) {
      const idTabela = Number(dadosMarcas[i][0]);
      const dataExclusaoTabela = dadosMarcas[i][3] ? dadosMarcas[i][3].toString().trim() : "";

      if(idTabela === idMarca && dataExclusaoTabela === "") {
        linhaLocalizada = i + firstLineEquipments;
        break; 
      }
    }

    if (linhaLocalizada !== -1) {
      const dataExclusao = Utilities.formatDate(new Date(), "GMT-3", "dd/MM/yyyy");

      abaConsultaMarca.getRange(linhaLocalizada, equipDtAlteracaoCol).setValue(dataExclusao);
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
  */