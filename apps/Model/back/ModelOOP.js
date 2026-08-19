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
    this.ss = SpreadsheetApp.getActiveSpreadsheet();
  }

  /**
   * Obtém a instância da aba ativa
   */
  getSheet() {
    const sheet = this.ss.getSheetByName(this.tableName);
    if (!sheet) {
      throw new Error(`A aba '${this.tableName}' não foi encontrada.`);
    }
    return sheet;
  }

  /**
   * Lê todos os dados da aba a partir da linha e quantidade de colunas definidas
   */
  readAll(numColumns) {
    const sheet = this.getSheet();
    const lastRow = sheet.getLastRow();

    if (lastRow === 0 || lastRow < this.firstLine) {
      return [];
    }

    const numRows = lastRow - this.firstLine + 1;
    return sheet.getRange(this.firstLine, this.firstColumn, numRows, numColumns).getValues();
  }

  /**
   * Busca um texto/contexto na planilha usando o TextFinder
   * @param {string} context - Termo a ser pesquisado
   * @param {boolean} matchExact - true para célula exata, false para "contém"
   * @param {number} numColumns - Quantidade de colunas do intervalo
   * @returns {Range|null} Retorna a célula encontrada ou null
   */
  searchContext(context, matchExact = false, numColumns = 1) {
    const sheet = this.getSheet();
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
  filter(predicates = [], numColumns = 2) {
    const dados = this.readAll(numColumns);

    return dados.filter(linha => {
      // Retorna true se a linha passar em todas as regras/condições passadas
      return predicates.every(predicateFn => predicateFn(linha));
    });
  }
}