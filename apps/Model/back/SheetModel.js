class SheetModel {
  /**
   * @param {string} tableName - Nome da aba na planilha.
   * @param {number} [firstLine=3] - Linha onde iniciam os dados (cabeçalho é 2).
   * @param {number} [firstColumn=1] - Coluna inicial de leitura.
   */
  constructor(tableName, firstLine = 3, firstColumn = 1) {
    this.tableName = tableName;
    this.firstLine = firstLine;
    this.firstColumn = firstColumn;
    this.numColumns = 6
    this.colId = 0
    this.colActive = 3
    this.colDtCadastro = 4
    this.colDtAlteracao = 5
    this.colDtExclusao = 6

    Logger.log('Constructor - firstLine' + firstLine)

    this.ss = this.getSheet()
  }

  setNumColumns(num) {
    this.numColumns = num
  }

  setIdColumn(num) {
    this.colId = num
  }

  setActiveColumn(num) {
    this.colActive = num
  }
  setDtCadastroColumn(num) {
    this.colDtCadastro = num
  }  
  setDtAlteracaoColumn(num) {
    this.colDtAlteracao = num
  }
  setDtExclusaoColumn(num) {
    this.colDtExclusao = num
  }

  /**
   * Obtém a instância da aba ativa
   */
  getSheet() {
    Logger.log('SheetModel - getSheet')
    Logger.log(this.ss)
    Logger.log(this.tableName)
    const ss = SpreadsheetApp.getActive();
    const sheet = ss.getSheetByName(this.tableName);
    if (!sheet) {
      throw new Error(`A aba '${this.tableName}' não foi encontrada.`);
    }
    return sheet;
  }

  /**
   * Lê todos os dados da aba a partir da linha e quantidade de colunas definidas
   */
  readAll() {
    Logger.log('sheetModel - readAll')
    const lastRow = this.ss.getLastRow();

    if (lastRow === 0 || lastRow < this.firstLine) {
      return [];
    }

    return this.arrayToOfObjects(this.ss.getDataRange().getValues())
  }

  arrayToOfObjects(range) {

    let headers = range[this.firstLine -2]
    let nameColumn = "";
    for (let i = 0; i < headers.length ; i++ ) {
      nameColumn = headers[i]
      headers[i] = nameColumn.toLowerCase();
    }

    let objectArray = [];

    for (let i = this.firstLine -1; i < range.length ; i++) {
      let objectRow = {};

      headers.forEach( function(header, indexColumn) {
        objectRow[header] = String(range[i][indexColumn]).trim();
      });

      objectRow['line'] = String( i + 1 ).trim()

      objectArray.push(objectRow);
    }

    return objectArray

  }

  // -----------------------------------------------------
  // Lê todos os registros
  // -----------------------------------------------------
  read() {
    const rows = this.readAll();
    
    if (!rows) return false;

    Logger.log('Rows: ')
    Logger.log(rows)

    return rows
  }

  findId(id) {
    dados = this.readAll();

    if (!dados) return false;

    let index = dados.findIndex( row => { 
                  return row.content.id = id
                } )
    return dados[index];
  }

  /**
   * Busca um texto/contexto na planilha usando o TextFinder
   * @param {string} context - Termo a ser pesquisado
   * @param {boolean} matchExact - true para célula exata, false para "contém"
   * @param {number} numColumns - Quantidade de colunas do intervalo
   * @returns {Range|null} Retorna a célula encontrada ou null
   */
  searchContext(context, matchExact = false, numColumns = 1) {
    const sheet = this.ss;
    const lastRow = sheet.getLastRow();

    if (lastRow < this.firstLine) return null;

    const numRows = lastRow - this.firstLine + 1;
    const range = sheet.getRange(this.firstLine, this.firstColumn, numRows, numColumns);

    const finder = range.createTextFinder(String(context)).matchEntireCell(matchExact);
    const result = finder.findNext();

    if (result) {
      Logger.log(`Contexto '${context}' encontrado na linha: ${result.getRow()}`);
      return result;
    }

    Logger.log(`Contexto '${context}' não encontrado.`);
    return null;
  }

  /**
   * Filtra registros com base em condições dinâmicas
   * @param {Array<Function>} predicates - Lista de funções de validação por linha
   * @param {number} numColumns - Quantidade de colunas
   */
  filter(predicates = []) {
    const dados = this.readAll();

    return dados.filter(linha => {
      // Retorna true se a linha passar em todas as regras/condições passadas
      return predicates.every(predicateFn => predicateFn(linha));
    });
  }

  excluir(id) {
    Logger.log('SheetModel.js - metodo excluir')

    try {
      if (typeof id !== 'number') {
        return { sucesso: false, mensagem: "ID inválido." };
      }

      const tab = this.ss;

      const dados = findId(id)

      if (!dados) {
        Logger.log("Registro não encontrado para o ID: " + id);
        return false
      }
      let linhaLocalizada = read(id);

      const dataExclusao = Utilities.formatDate(new Date(), "GMT-3", "dd/MM/yyyy");

      tab.getRange(linhaLocalizada, this.colDtExclusao).setValue(dataExclusao);
      tab.getRange(linhaLocalizada, 1, 1, this.numColumns).setBackground("#F4CCCC");

      Logger.log("Registro " + id + " Excluido " + linhaLocalizada);   
      return true

    } catch (e) {
      Logger.log("Erro no servidor ao excluir o registro: " + e.message + " da tabela " + this.tableName);
      return false
      
    }
  }

  setStatus(id) {
    Logger.log('SheetModel.js - metodo setStatus')

    try{

      if (typeof id !== 'number') {
        return { sucesso: false, mensagem: "ID inválido." };
      }

      const planilha = SpreadsheetApp.getActiveSpreadsheet();
      const tab = planilha.getSheetByName(this.tableName);

      if (!tab) {
        Logger.log("Aba " + this.tableName +" não foi encontrada na planilha.");    
        return;
      }

      const dados = ReadAll();
      let linhaLocalizada = -1;

      for (let i = 0; i <dados.length; i ++) {
        const idTabela = Number(dados[i][this.colId]);
        const dataExclusaoTabela = dados[i][this.colDtExclusao] ? dados[i][this.colDtExclusao].toString().trim() : "";

        if(idTabela === id && dataExclusaoTabela === "") {
          linhaLocalizada = i + firstLineBrands;
          break; 
        }
      }

      if (linhaLocalizada !== -1) {
        const dataExclusao = Utilities.formatDate(new Date(), "GMT-3", "dd/MM/yyyy");

        tab.getRange(linhaLocalizada, this.colDtExclusao).setValue(dataExclusao);
        tab.getRange(linhaLocalizada, 1, 1, this.numColumns).setBackground("#F4CCCC");

        Logger.log("Registro " + id + " Excluido " + linhaLocalizada);   
        return true

      } else {
        Logger.log("Registro não encontrado para o ID: " + id);
        return false

      }
    } catch (e) {
      Logger.log("Erro no servidor ao excluir o registro: " + e.message + " da tabela " + this.tableName);
      return false

    }
  }
}
