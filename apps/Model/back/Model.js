function ReadSheet(table, firstLine, columns) {
  const ss = SpreadsheetApp.getActive();
  const sheetSS = ss.getSheetByName(table);

  let lastLine = sheetSS.getLastRow();

  if ((lastLine === 0) || (lastLine === (firstLine -1))) {
    return Array()
  }

  return sheetSS.getRange(firstLine, 1, lastLine -firstLine +1, columns).getValues();
 
}

function filterMultipleColumns(table, conditions = [], startLine = 3, numColumns = 2) {
  const tab = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(table);
  const numRows = tab.getLastRow() - startLine;
  
  const intervaloRows = tab.getRange(startLine, firstColumn, numRows, numColumns); 
  const dados = intervaloRows.getValues();
  
  // 2. Monta os critérios
  var criterioColunaA = "Ativo"; // Exemplo: coluna 1 (índice 0) deve ser "Ativo"
  var termoPesquisa = "Londrina"; // Exemplo: coluna 2 ou 3 deve conter "Londrina"
  
  // 3. Aplique o filtro usando os índices das colunas (0 = Coluna A, 1 = Coluna B, etc.)
  let dadosFiltrados = dados.filter(function(linha) {

    for ( let i = 0 ; i <= numRows; i++ ) {
      condition[2]  (conditions[2] == "" || conditions[2] == linha[i][2] )
    }
    let condicao1 = linha[0] === criterioColunaA; // Coluna A
    let condicao2 = linha[1].toString().includes(termoPesquisa) || linha[2].toString().includes(termoPesquisa); // Coluna B ou C
    
    return condicao1 && condicao2;
  });
}

function FindContext(table, context, firstLine, numColumns) {
  return ReadSheetColumns(table, firstLine, numColumns, context, true)
}

function SearchContext(table, context, firstLine, numColumns) {

  return ReadSheetColumns(table, firstLine, numColumns, context, false)
}

function ReadSheetColumns(sheetName, startLine, numColumns, context, fixed = false) {
  var planilha = SpreadsheetApp.getActiveSpreadsheet();
  var aba = planilha.getSheetByName(sheetName); // Nome da sua aba
  
  // Define a coluna (coluna firstColumn), da linha startLine até a última linha preenchida e a quantidade de colunas (numColumns)
  var numRows = aba.getLastRow() - startLine;
  var intervaloColuna = aba.getRange(startLine, firstColumn, numRows, numColumns); 
  
  // Cria o localizador restrito à coluna e busca o contexto exato
  var encontrador = intervaloColuna.createTextFinder(context);
  encontrador.matchEntireCell(fixed); // Exige que a célula seja exatamente o contexto (true) ou não (false)
  
  var resultado = encontrador.findNext();
  
  if (resultado) {
    var linhaEncontrada = resultado.getRow();
    Logger.log("Código encontrado na linha: " + linhaEncontrada);
    // Opcional: Seleciona a célula na planilha
    resultado.activate();
  } else {
    Logger.log("Código não encontrado.");
  }
}
 