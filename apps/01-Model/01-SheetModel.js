
const TZ = 'America/Sao_Paulo';

class SheetModel {
  /**
   * @param {string} tableName - Nome da aba na planilha.
   * @param {number} [firstLine=3] - Linha onde iniciam os dados (cabeçalho é firstLine - 1).
   * @param {number} [firstColumn=1] - Coluna inicial de leitura (1-based).
   */
  constructor(tableName, firstLine = 3, firstColumn = 1) {
    this.tableName = tableName;
    this.firstLine = firstLine;
    this.firstColumn = firstColumn;
    this.numColumns = 6
    this.colId = 1 // confirmar se não seria 0, pois a primeira coluna é a A (índice 0)
    this.colActive = 3
    this.colDtCadastro = 4
    this.colDtAlteracao = 5
    this.colDtExclusao = 6

    Logger.log('Constructor - firstLine: ' + firstLine)

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
    Logger.log('SheetModel - getSheet: ' + this.tableName)
    const ss = SpreadsheetApp.getActive();
    const sheet = ss.getSheetByName(this.tableName);
    if (!sheet) {
      throw new Error(`A aba '${this.tableName}' não foi encontrada.`);
    }
    return sheet;
  }

  /**
   * Lê os dados da aba a partir da linha definida.
   * @param {boolean} [incluirExcluidos=false] - Se true, inclui registros com dt_exclusao preenchida.
   */
  readAll(incluirExcluidos = false) {
    Logger.log('SheetModel - readAll')
    const lastRow = this.ss.getLastRow();

    if (lastRow === 0 || lastRow < this.firstLine) {
      return [];
    }

    return this.arrayToOfObjects(this.ss.getDataRange().getValues(), incluirExcluidos)
  }

  /**
   * Converte a matriz de valores em objetos (chaves = cabeçalho em minúsculas).
   * @param {Array<Array<any>>} range - Matriz retornada por getValues().
   * @param {boolean} [incluirExcluidos=false]
   */
  arrayToOfObjects(range, incluirExcluidos = false) {

    const headers = range[this.firstLine - 2].map(h => String(h).trim().toLowerCase());

    const objectArray = [];

    for (let i = this.firstLine - 1; i < range.length; i++) {
      const row = range[i];

      if (row.every(c => c === '')) continue;

      if (!incluirExcluidos && String(row[this.colDtExclusao - 1]).trim() !== '') continue;

      const objectRow = { line: String(i + 1) };

      headers.forEach((header, indexColumn) => {
        if (!header) return;
        const valor = row[indexColumn];
        objectRow[header] = valor instanceof Date
          ? Utilities.formatDate(valor, TZ, 'dd/MM/yyyy')
          : String(valor).trim();
      });

      objectArray.push(objectRow);
    }

    return objectArray
  }

  // -----------------------------------------------------
  // Lê todos os registros
  // -----------------------------------------------------
  read(incluirExcluidos = false) {
    const rows = this.readAll(incluirExcluidos);

    Logger.log('Rows: ' + rows.length)
    return rows
  }

  findId(id) {
    return this.readById(id)
  }

  /**
   * Busca um registro pelo ID (coluna 'id' do cabeçalho).
   * @returns {Object|null}
   */
  readById(id, incluirExcluidos = false) {
    const alvo = String(id).trim();
    return this.readAll(incluirExcluidos).find(row => row['id'] === alvo) || null;
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
      return result;
    }

    return null;
  }

  /**
   * Filtra registros com base em condições dinâmicas
   * @param {Array<Function>} predicates - Lista de funções de validação por linha
   */
  filter(predicates = []) {
    const dados = this.readAll();

    return dados.filter(linha => {
      // Retorna true se a linha passar em todas as regras/condições passadas
      return predicates.every(predicateFn => predicateFn(linha));
    });
  }

  readContext( criterios ) {
    console.log('SheetModel.readContext(' + criterios + ')' )  // mantido: stub pendente de implementação
  }

  /**
   * Exclusão lógica: preenche a data de exclusão e pinta a linha.
   * @param {number|string} parId
   * @returns {{sucesso: boolean, mensagem: string}}
   */
  excluir(parId) {
    const id = Number(parId);
    if (!Number.isInteger(id) || id <= 0) {
      return { sucesso: false, mensagem: 'ID inválido.' };
    }

    const lock = LockService.getScriptLock();
    try {
      lock.waitLock(10000);
    } catch (e) {
      return { sucesso: false, mensagem: 'Sistema ocupado, tente novamente.' };
    }

    try {

      const registro = this.readById(id);

      if (!registro) {
        Logger.log('Registro não encontrado para o ID: ' + id);
        return { sucesso: false, mensagem: 'Registro não encontrado.' };
      }

      const linha = Number(registro.line);
      const dataExclusao = Utilities.formatDate(new Date(), TZ, 'dd/MM/yyyy');

      this.ss.getRange(linha, this.colDtExclusao).setValue(dataExclusao);
      this.ss.getRange(linha, 1, 1, this.numColumns).setBackground('#F4CCCC');

      Logger.log(`Registro ${id} excluído na linha ${linha}`);
      return { sucesso: true, mensagem: 'Registro excluído.' };
    } catch (e) {
      Logger.log(`Erro ao excluir ID ${id} na aba ${this.tableName}: ${e.message}`);
      return { sucesso: false, mensagem: 'Erro ao excluir o registro.' };
    } finally {
      lock.releaseLock();
    }
  }

}

const MODELS = new Map([
  ['tbl_equipamentos', () => new EquipmentsModel()],
]);

function readContext(table, criterios) {
  console.log(`SheetModel - readContext(table: ${table})`);

  const factory = MODELS.get(table);
  return factory ? factory().readContext(criterios) : null;
}

function readById(table, id) {
  console.log(`SheetModel - readById(table: ${table}, id: ${id})`);

  const factory = MODELS.get(table);
  return factory ? factory().readById(id) : null;
}