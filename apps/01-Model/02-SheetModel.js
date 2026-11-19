/**
 * ============================================================================
 * 02-SheetModel.js - Camada Base de Acesso e Modelagem para Google Sheets (OOP)
 * ============================================================================
 * Classe base orientada a objetos para manipulação de abas de planilha (Google Sheets).
 *
 * Características principais:
 * - Descoberta automática de colunas/campos a partir da linha de cabeçalho.
 * - Linha de cabeçalho padrão: linha 2 (customizável via setHeaderLine / headerLine).
 * - Linha de início de dados padrão: linha 3 (customizável via setFirstLine / firstLine).
 * - Mapeamento bidirecional de colunas (nome do cabeçalho <-> índice 0-based e número 1-based).
 * - Detecção automática inteligente de colunas padrão (id, active, dt_cadastro, dt_alteracao, dt_exclusao).
 * - Operações CRUD orientadas a objeto: read, readById, findBy, filter, insert, update, save, excluir (soft delete), reativar.
 * - Suporte a registros como objetos com propriedades dinâmicas correspondentes aos campos.
 * - Tratamento seguro de datas para evitar falha silenciosa de serialização no google.script.run.
 */

class SheetModel2 {
  /**
   * Constante de fuso horário padrão do sistema
   */
  static get DEFAULT_TIMEZONE() {
    return 'America/Sao_Paulo';
  }

  /**
   * Registro estático de factories de models para resolução por nome de tabela
   */
  // Getter em vez de "static modelsRegistry = new Map();": o parser do Apps
  // Script não aceita campos de classe (static ou de instância), só métodos.
  static get modelsRegistry() {
    if (!SheetModel._modelsRegistry) SheetModel._modelsRegistry = new Map();
    return SheetModel._modelsRegistry;
  }

  /**
   * Registra um model derivado para uma tabela específica
   * @param {string} tableName Nome da aba da tabela
   * @param {Function} factoryFn Função factory que instancia o model
   */
  static registerModel(tableName, factoryFn) {
    SheetModel.modelsRegistry.set(tableName, factoryFn);
  }

  /**
   * Obtém a instância do model registrado para uma tabela
   * @param {string} tableName
   * @returns {SheetModel|null}
   */
  static getModel(tableName) {
    const factory = SheetModel.modelsRegistry.get(tableName);
    return factory ? factory() : null;
  }

  /**
   * Busca um registro por ID em uma tabela registrada
   * @param {string} tableName Nome da tabela
   * @param {number|string} id Identificador
   * @returns {Object|null}
   */
  static readById(tableName, id) {
    const model = SheetModel.getModel(tableName);
    return model ? model.readById(id) : null;
  }

  /**
   * Busca contexto/critérios em uma tabela registrada
   * @param {string} tableName Nome da tabela
   * @param {*} criterios
   * @returns {*}
   */
  static readContext(tableName, criterios) {
    const model = SheetModel.getModel(tableName);
    return model && typeof model.readContext === 'function' ? model.readContext(criterios) : null;
  }

  /**
   * Construtor da classe SheetModel
   * @param {string} tableName - Nome da aba da planilha
   * @param {number} [firstLine=3] - Linha onde iniciam os dados (default: 3)
   * @param {number} [headerLine=2] - Linha onde estão os nomes das colunas (default: 2)
   * @param {number} [firstColumn=1] - Coluna inicial de leitura (1-based, default: 1)
   */
  constructor(tableName, firstLine = 3, headerLine = 2, firstColumn = 1) {
    if (!tableName) {
      throw new Error('SheetModel: O parâmetro tableName é obrigatório.');
    }

    this._tableName = String(tableName).trim();
    this._firstLine = Number(firstLine) || 3;
    this._headerLine = Number(headerLine) || 2;
    this._firstColumn = Number(firstColumn) || 1;
    this._timeZone = SheetModel.DEFAULT_TIMEZONE;

    // Estruturas de metadados das colunas
    this._headers = [];        // Nomes originais dos cabeçalhos na planilha
    this._fields = [];         // Nomes normalizados (chaves de objeto)
    this._columnMap = new Map(); // Mapa de busca rápida: nome/chave -> { name, key, index, colNumber }
    this._numColumns = 0;

    // Configurações de colunas especiais (1-based para getRange, resolvidas automaticamente)
    this._colId = 1;
    this._colActive = null;
    this._colDtCadastro = null;
    this._colDtAlteracao = null;
    this._colDtExclusao = null;

    // Referência em cache para a aba ativa
    this._sheet = null;

    // Carrega e mapeia as colunas da planilha imediatamente
    this.init();
  }

  // ==========================================================================
  // GETTERS & SETTERS (Propriedades OOP)
  // ==========================================================================

  get tableName() {
    return this._tableName;
  }

  set tableName(name) {
    this._tableName = String(name).trim();
    this._sheet = null;
    this.loadHeaders();
  }

  get firstLine() {
    return this._firstLine;
  }

  set firstLine(line) {
    this._firstLine = Math.max(1, Number(line) || 3);
  }

  get headerLine() {
    return this._headerLine;
  }

  set headerLine(line) {
    this.setHeaderLine(line);
  }

  get firstColumn() {
    return this._firstColumn;
  }

  set firstColumn(col) {
    this._firstColumn = Math.max(1, Number(col) || 1);
    this.loadHeaders();
  }

  get numColumns() {
    return this._numColumns;
  }

  set numColumns(num) {
    this._numColumns = Number(num) || this._headers.length;
  }

  get timeZone() {
    return this._timeZone;
  }

  set timeZone(tz) {
    this._timeZone = tz || SheetModel.DEFAULT_TIMEZONE;
  }

  get colId() {
    return this._colId;
  }

  set colId(val) {
    this.setIdColumn(val);
  }

  get colActive() {
    return this._colActive;
  }

  set colActive(val) {
    this.setActiveColumn(val);
  }

  get colDtCadastro() {
    return this._colDtCadastro;
  }

  set colDtCadastro(val) {
    this.setDtCadastroColumn(val);
  }

  get colDtAlteracao() {
    return this._colDtAlteracao;
  }

  set colDtAlteracao(val) {
    this.setDtAlteracaoColumn(val);
  }

  get colDtExclusao() {
    return this._colDtExclusao;
  }

  set colDtExclusao(val) {
    this.setDtExclusaoColumn(val);
  }

  /**
   * Compatibilidade com código legado que acessava `this.ss`
   */
  get ss() {
    return this.getSheet();
  }

  // ==========================================================================
  // CONFIGURAÇÃO FLUENTE DAS COLUNAS E LINHAS
  // ==========================================================================

  /**
   * Define o número da linha onde estão os nomes das colunas (campos) e recarrega os cabeçalhos.
   * @param {number} lineNumber - Número da linha na planilha (1-based, default: 2)
   * @returns {SheetModel} A própria instância para encadeamento
   */
  setHeaderLine(lineNumber) {
    const num = Number(lineNumber);
    if (!Number.isInteger(num) || num < 1) {
      throw new Error(`SheetModel: Número de linha de cabeçalho inválido (${lineNumber}).`);
    }

    this._headerLine = num;
    this.loadHeaders();
    return this;
  }

  /**
   * Define a linha inicial onde começam os registros de dados
   * @param {number} lineNumber - Número da linha (1-based, default: 3)
   * @returns {SheetModel}
   */
  setFirstLine(lineNumber) {
    this._firstLine = Math.max(1, Number(lineNumber) || 3);
    return this;
  }

  /**
   * Define a coluna inicial da tabela
   * @param {number} columnNumber - Número da coluna (1-based, default: 1)
   * @returns {SheetModel}
   */
  setFirstColumn(columnNumber) {
    this._firstColumn = Math.max(1, Number(columnNumber) || 1);
    this.loadHeaders();
    return this;
  }

  /**
   * Define a quantidade total de colunas da tabela
   * @param {number} num
   * @returns {SheetModel}
   */
  setNumColumns(num) {
    this._numColumns = Number(num) || 0;
    return this;
  }

  /**
   * Define a coluna de ID por nome (string) ou índice/número
   * @param {string|number} colIdentifier
   * @returns {SheetModel}
   */
  setIdColumn(colIdentifier) {
    this._colId = this._resolveColumnNumber(colIdentifier, 1);
    return this;
  }

  /**
   * Define a coluna de status ativo por nome ou índice/número
   * @param {string|number} colIdentifier
   * @returns {SheetModel}
   */
  setActiveColumn(colIdentifier) {
    this._colActive = this._resolveColumnNumber(colIdentifier, null);
    return this;
  }

  /**
   * Define a coluna de Data de Cadastro por nome ou índice/número
   * @param {string|number} colIdentifier
   * @returns {SheetModel}
   */
  setDtCadastroColumn(colIdentifier) {
    this._colDtCadastro = this._resolveColumnNumber(colIdentifier, null);
    return this;
  }

  /**
   * Define a coluna de Data de Alteração por nome ou índice/número
   * @param {string|number} colIdentifier
   * @returns {SheetModel}
   */
  setDtAlteracaoColumn(colIdentifier) {
    this._colDtAlteracao = this._resolveColumnNumber(colIdentifier, null);
    return this;
  }

  /**
   * Define a coluna de Data de Exclusão (Soft Delete) por nome ou índice/número
   * @param {string|number} colIdentifier
   * @returns {SheetModel}
   */
  setDtExclusaoColumn(colIdentifier) {
    this._colDtExclusao = this._resolveColumnNumber(colIdentifier, null);
    return this;
  }

  // ==========================================================================
  // ACESSO À PLANILHA E DESCOBERTA DE CABEÇALHOS
  // ==========================================================================

  /**
   * Inicializa o model e carrega os cabeçalhos da planilha
   * @returns {SheetModel}
   */
  init() {
    try {
      this.loadHeaders();
    } catch (e) {
      Logger.log(`SheetModel: Inicialização adiada para '${this._tableName}': ${e.message}`);
    }
    return this;
  }

  /**
   * Obtém a instância da aba da planilha (Google Sheets Sheet) com cache
   * @returns {GoogleAppsScript.Spreadsheet.Sheet}
   */
  getSheet() {
    if (this._sheet) {
      return this._sheet;
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.getActive();
    if (!ss) {
      throw new Error('SheetModel: Nenhuma planilha ativa encontrada.');
    }

    const sheet = ss.getSheetByName(this._tableName);
    if (!sheet) {
      throw new Error(`SheetModel: A aba '${this._tableName}' não foi encontrada na planilha.`);
    }

    this._sheet = sheet;
    return this._sheet;
  }

  /**
   * Lê a linha de cabeçalho da planilha e mapeia todas as colunas existentes.
   * Executado automaticamente na criação e sempre que setHeaderLine é chamado.
   * @returns {SheetModel}
   */
  loadHeaders() {
    const sheet = this.getSheet();
    const lastCol = sheet.getLastColumn();

    this._headers = [];
    this._fields = [];
    this._columnMap.clear();

    if (lastCol < this._firstColumn) {
      this._numColumns = 0;
      return this;
    }

    const numCols = lastCol - this._firstColumn + 1;
    const headerRange = sheet.getRange(this._headerLine, this._firstColumn, 1, numCols);
    const rawHeaders = headerRange.getValues()[0];

    rawHeaders.forEach((val, idx) => {
      const headerOriginal = String(val !== null && val !== undefined ? val : '').trim();
      const normalizedKey = this._normalizeKey(headerOriginal);
      const colNumber = this._firstColumn + idx; // 1-based no Sheets

      this._headers.push(headerOriginal);
      this._fields.push(normalizedKey);

      const colInfo = {
        name: headerOriginal,
        key: normalizedKey,
        index: idx,             // 0-based relativo a firstColumn
        colNumber: colNumber    // 1-based absoluto no sheet (pronto para getRange)
      };

      if (normalizedKey) {
        this._columnMap.set(normalizedKey, colInfo);
      }

      if (headerOriginal) {
        this._columnMap.set(headerOriginal.toLowerCase(), colInfo);
        this._columnMap.set(headerOriginal, colInfo);

        const semAcentos = this._removeAccents(headerOriginal.toLowerCase());
        if (semAcentos !== headerOriginal.toLowerCase()) {
          this._columnMap.set(semAcentos, colInfo);
        }
      }
    });

    this._numColumns = this._headers.length;

    // Detecta automaticamente as colunas padrão caso não tenham sido setadas explicitamente
    this._autoDetectStandardColumns();

    return this;
  }

  /**
   * Detecta automaticamente as colunas padrão da tabela a partir dos nomes mapeados
   * @private
   */
  _autoDetectStandardColumns() {
    // ID
    if (!this._colId || this._colId === 1) {
      const colIdInfo = this.findColumn(['id', 'codigo', 'código', 'cod', `id_${this._tableName.replace(/^tbl_/, '')}`]);
      if (colIdInfo) this._colId = colIdInfo.colNumber;
    }

    // Active
    if (!this._colActive) {
      const colActiveInfo = this.findColumn(['active', 'ativo', 'status', 'situacao', 'situação']);
      if (colActiveInfo) this._colActive = colActiveInfo.colNumber;
    }

    // Dt Cadastro
    if (!this._colDtCadastro) {
      const colDtCadInfo = this.findColumn(['dt_cadastro', 'data_cadastro', 'data cadastro', 'dt cadastro', 'cadastro', 'data_criacao']);
      if (colDtCadInfo) this._colDtCadastro = colDtCadInfo.colNumber;
    }

    // Dt Alteração
    if (!this._colDtAlteracao) {
      const colDtAltInfo = this.findColumn(['dt_alteracao', 'data_alteracao', 'data alteracao', 'dt alteracao', 'alteracao', 'dt_modificacao']);
      if (colDtAltInfo) this._colDtAlteracao = colDtAltInfo.colNumber;
    }

    // Dt Exclusão (Soft Delete)
    if (!this._colDtExclusao) {
      const colDtExcInfo = this.findColumn(['dt_exclusao', 'data_exclusao', 'data exclusao', 'dt exclusao', 'exclusao', 'dt_desativacao']);
      if (colDtExcInfo) this._colDtExclusao = colDtExcInfo.colNumber;
    }
  }

  // ==========================================================================
  // CONSULTA E METADADOS DE CAMPOS
  // ==========================================================================

  /**
   * Retorna os nomes originais de todas as colunas encontradas no cabeçalho
   * @returns {string[]}
   */
  getHeaders() {
    return [...this._headers];
  }

  /**
   * Retorna os nomes das colunas (alias para getHeaders)
   * @returns {string[]}
   */
  getColumnNames() {
    return this.getHeaders();
  }

  /**
   * Retorna as chaves normalizadas de campos de todas as colunas
   * @returns {string[]}
   */
  getFields() {
    return [...this._fields];
  }

  /**
   * Verifica se a coluna/campo existe na tabela
   * @param {string} columnNameOrKey
   * @returns {boolean}
   */
  hasColumn(columnNameOrKey) {
    if (!columnNameOrKey) return false;
    const str = String(columnNameOrKey).trim();
    return this._columnMap.has(str) ||
           this._columnMap.has(str.toLowerCase()) ||
           this._columnMap.has(this._normalizeKey(str));
  }

  /**
   * Retorna os metadados da coluna ({ name, key, index, colNumber }) ou null
   * @param {string|number} columnNameOrKey
   * @returns {Object|null}
   */
  getColumnInfo(columnNameOrKey) {
    if (typeof columnNameOrKey === 'number') {
      const colNumber = columnNameOrKey;
      const index0 = colNumber >= this._firstColumn ? colNumber - this._firstColumn : colNumber;
      if (index0 >= 0 && index0 < this._headers.length) {
        return {
          name: this._headers[index0],
          key: this._fields[index0],
          index: index0,
          colNumber: this._firstColumn + index0
        };
      }
      return null;
    }

    const str = String(columnNameOrKey || '').trim();
    return this._columnMap.get(str) ||
           this._columnMap.get(str.toLowerCase()) ||
           this._columnMap.get(this._normalizeKey(str)) ||
           null;
  }

  /**
   * Retorna o índice 0-based da coluna (para indexar matrizes/arrays de dados)
   * @param {string|number} columnNameOrKey
   * @returns {number} Retorna -1 se não encontrar
   */
  getColumnIndex(columnNameOrKey) {
    const info = this.getColumnInfo(columnNameOrKey);
    return info ? info.index : -1;
  }

  /**
   * Retorna o número 1-based da coluna na planilha (para sheet.getRange)
   * @param {string|number} columnNameOrKey
   * @returns {number} Retorna -1 se não encontrar
   */
  getColumnNumber(columnNameOrKey) {
    const info = this.getColumnInfo(columnNameOrKey);
    return info ? info.colNumber : -1;
  }

  /**
   * Procura uma coluna a partir de uma lista de nomes candidatos
   * @param {string[]} candidateNames
   * @returns {Object|null}
   */
  findColumn(candidateNames = []) {
    for (const name of candidateNames) {
      const info = this.getColumnInfo(name);
      if (info) return info;
    }
    return null;
  }

  /**
   * Retorna o índice 0-based da coluna de Data de Exclusão
   * @returns {number}
   */
  getDtExclusaoIndex() {
    if (this._colDtExclusao) {
      // Se configurado como 1-based
      if (this._colDtExclusao >= this._firstColumn) {
        return this._colDtExclusao - this._firstColumn;
      }
      // Se configurado como 0-based
      return this._colDtExclusao;
    }
    return -1;
  }

  // ==========================================================================
  // OPERAÇÕES DE LEITURA (READ / QUERY)
  // ==========================================================================

  /**
   * Lê todos os registros da aba convertidos para objetos com nomes de campos
   * @param {boolean} [incluirExcluidos=false] Se true, inclui linhas com dt_exclusao preenchida
   * @returns {Object[]} Lista de objetos representando cada linha
   */
  readAll(incluirExcluidos = false) {
    const sheet = this.getSheet();
    const lastRow = sheet.getLastRow();

    if (lastRow === 0 || lastRow < this._firstLine) {
      return [];
    }

    const numRows = lastRow - this._firstLine + 1;
    const numCols = Math.max(this._numColumns, sheet.getLastColumn() - this._firstColumn + 1);

    const values = sheet.getRange(this._firstLine, this._firstColumn, numRows, numCols).getValues();
    return this.rawValuesToObjects(values, this._firstLine, incluirExcluidos);
  }

  /**
   * Alias de conveniência para readAll
   * @param {boolean} [incluirExcluidos=false]
   * @returns {Object[]}
   */
  read(incluirExcluidos = false) {
    return this.readAll(incluirExcluidos);
  }

  /**
   * Busca um registro pelo valor do ID
   * @param {number|string} id Identificador buscado
   * @param {boolean} [incluirExcluidos=false]
   * @returns {Object|null}
   */
  readById(id, incluirExcluidos = false) {
    if (id === null || id === undefined || String(id).trim() === '') {
      return null;
    }

    const alvo = String(id).trim();
    const todos = this.readAll(incluirExcluidos);

    // Tenta primeiro pelo campo 'id'
    let registro = todos.find(row => String(row.id || '').trim() === alvo);
    if (registro) return registro;

    // Se não encontrou, busca pela coluna configurada em this._colId
    const colIdInfo = this.getColumnInfo(this._colId);
    if (colIdInfo && colIdInfo.key && colIdInfo.key !== 'id') {
      registro = todos.find(row => String(row[colIdInfo.key] || '').trim() === alvo);
    }

    return registro || null;
  }

  /**
   * Alias para readById
   */
  findById(id, incluirExcluidos = false) {
    return this.readById(id, incluirExcluidos);
  }

  /**
   * Busca o primeiro registro que coincida com a coluna e valor especificados
   * @param {string} columnName Nome ou chave da coluna
   * @param {*} value Valor a comparar
   * @param {boolean} [incluirExcluidos=false]
   * @returns {Object|null}
   */
  findBy(columnName, value, incluirExcluidos = false) {
    const info = this.getColumnInfo(columnName);
    if (!info) return null;

    const valorStr = String(value !== null && value !== undefined ? value : '').trim().toLowerCase();
    const registros = this.readAll(incluirExcluidos);

    return registros.find(row => {
      const v = String(row[info.key] !== undefined ? row[info.key] : row[info.name] || '').trim().toLowerCase();
      return v === valorStr;
    }) || null;
  }

  /**
   * Filtra registros com base em predicados/funções de validação
   * @param {Array<Function>|Function} predicates Função ou lista de funções (row => boolean)
   * @param {boolean} [incluirExcluidos=false]
   * @returns {Object[]}
   */
  filter(predicates = [], incluirExcluidos = false) {
    const fns = Array.isArray(predicates) ? predicates : [predicates];
    const dados = this.readAll(incluirExcluidos);

    return dados.filter(linha => fns.every(fn => fn(linha)));
  }

  /**
   * Retorna o primeiro registro que satisfaz a condição
   * @param {Function} predicateFn
   * @param {boolean} [incluirExcluidos=false]
   * @returns {Object|null}
   */
  find(predicateFn, incluirExcluidos = false) {
    if (typeof predicateFn !== 'function') return null;
    const dados = this.readAll(incluirExcluidos);
    return dados.find(predicateFn) || null;
  }

  /**
   * Converte uma matriz de valores crus da planilha em array de objetos nomeados
   * @param {Array<Array<*>>} rangeValues Matriz retornada por getValues()
   * @param {number} [startRowIndex=3] Número da linha inicial correspondente na planilha
   * @param {boolean} [incluirExcluidos=false]
   * @returns {Object[]}
   */
  rawValuesToObjects(rangeValues, startRowIndex = 3, incluirExcluidos = false) {
    if (!rangeValues || rangeValues.length === 0) return [];

    const colExclIdx = this.getDtExclusaoIndex();
    const results = [];

    for (let i = 0; i < rangeValues.length; i++) {
      const row = rangeValues[i];
      if (!row || row.every(c => c === '' || c === null || c === undefined)) {
        continue;
      }

      // Validação de soft delete
      const valorExclusao = colExclIdx !== -1 && colExclIdx < row.length ? row[colExclIdx] : '';
      const isExcluido = valorExclusao !== '' && valorExclusao !== null && valorExclusao !== undefined;

      if (!incluirExcluidos && isExcluido) {
        continue;
      }

      const rowNumber = startRowIndex + i;
      const record = {
        line: String(rowNumber),
        _rowNumber: rowNumber,
        desativada: isExcluido,
        desativado: isExcluido
      };

      this._fields.forEach((fieldKey, idx) => {
        if (!fieldKey) return;
        const val = idx < row.length ? row[idx] : '';
        const valorFormatado = this._formatCellValue(val);

        record[fieldKey] = valorFormatado;

        // Atribui também pelo nome do cabeçalho original em minúsculas se for diferente
        const originalLower = (this._headers[idx] || '').trim().toLowerCase();
        if (originalLower && originalLower !== fieldKey && record[originalLower] === undefined) {
          record[originalLower] = valorFormatado;
        }

        // Atribui também pela versão sem acentos se for diferente
        const semAcento = this._removeAccents(fieldKey);
        if (semAcento && semAcento !== fieldKey && record[semAcento] === undefined) {
          record[semAcento] = valorFormatado;
        }
      });

      results.push(record);
    }

    return results;
  }

  /**
   * Compatibilidade com método legado arrayToOfObjects(range, incluirExcluidos)
   * @param {Array<Array<*>>} range Matriz completa lida da planilha (incluindo cabeçalhos)
   * @param {boolean} [incluirExcluidos=false]
   * @returns {Object[]}
   */
  arrayToOfObjects(range, incluirExcluidos = false) {
    if (!range || range.length === 0) return [];

    // Se o range inclui as linhas de cabeçalho (começando da linha 1)
    const dataStartIndex = this._firstLine - 1;
    if (range.length <= dataStartIndex) return [];

    const dataRows = range.slice(dataStartIndex);
    return this.rawValuesToObjects(dataRows, this._firstLine, incluirExcluidos);
  }

  /**
   * Busca um texto na planilha usando o TextFinder nativo do Apps Script
   * @param {string} context Termo pesquisado
   * @param {boolean} [matchExact=false] true para célula exata, false para "contém"
   * @param {number} [numColumns=1] Quantidade de colunas do intervalo pesquisado
   * @returns {GoogleAppsScript.Spreadsheet.Range|null}
   */
  searchContext(context, matchExact = false, numColumns = null) {
    const sheet = this.getSheet();
    const lastRow = sheet.getLastRow();
    if (lastRow < this._firstLine) return null;

    const numRows = lastRow - this._firstLine + 1;
    const cols = numColumns ? Number(numColumns) : Math.max(1, this._numColumns);
    const range = sheet.getRange(this._firstLine, this._firstColumn, numRows, cols);

    const finder = range.createTextFinder(String(context)).matchEntireCell(matchExact);
    return finder.findNext() || null;
  }

  /**
   * Cria um objeto de registro vazio inicializado com todos os campos conhecidos
   * @param {Object} [initialData={}]
   * @returns {Object}
   */
  createEmptyRecord(initialData = {}) {
    const record = { line: '' };
    this._fields.forEach(f => {
      if (f) record[f] = '';
    });
    return Object.assign(record, initialData);
  }

  // ==========================================================================
  // OPERAÇÕES DE ESCRITA E MUTAÇÃO (CREATE / UPDATE / SAVE / DELETE)
  // ==========================================================================

  /**
   * Insere um novo registro na planilha mapeando os campos do objeto para as colunas corretas
   * @param {Object} dados Objeto com as propriedades a salvar
   * @returns {{sucesso: boolean, mensagem: string, id?: number, line?: number}}
   */
  insert(dados) {
    if (!dados || typeof dados !== 'object') {
      return { sucesso: false, mensagem: 'Dados inválidos para inserção.' };
    }

    const lock = LockService.getScriptLock();
    try {
      lock.waitLock(10000);
    } catch (e) {
      return { sucesso: false, mensagem: 'Sistema ocupado, tente novamente em instantes.' };
    }

    try {
      const sheet = this.getSheet();
      const lastRow = sheet.getLastRow();
      const insertLine = Math.max(lastRow + 1, this._firstLine);

      // Calcula novo ID caso não tenha sido fornecido
      let novoId = dados.id;
      if (novoId === undefined || novoId === null || String(novoId).trim() === '') {
        novoId = this._computeNextId(sheet);
      }

      const hoje = Utilities.formatDate(new Date(), this._timeZone, 'dd/MM/yyyy');
      const rowArray = new Array(this._numColumns).fill('');

      // Monta o array da linha de acordo com as colunas conhecidas
      this._fields.forEach((fieldKey, idx) => {
        let valor = dados[fieldKey];

        // Fallbacks para nomes alternativos
        if (valor === undefined) {
          const originalName = this._headers[idx];
          valor = dados[originalName] !== undefined ? dados[originalName] : dados[this._removeAccents(fieldKey)];
        }

        // Auto-preenchimentos de colunas padrão caso vazias
        const colNum = this._firstColumn + idx;
        if (colNum === this._colId && (valor === undefined || valor === '')) {
          valor = novoId;
        } else if (colNum === this._colDtCadastro && (valor === undefined || valor === '')) {
          valor = hoje;
        } else if (colNum === this._colActive && (valor === undefined || valor === '')) {
          valor = 'Y';
        }

        rowArray[idx] = valor !== undefined && valor !== null ? valor : '';
      });

      sheet.getRange(insertLine, this._firstColumn, 1, this._numColumns).setValues([rowArray]);
      sheet.getRange(insertLine, this._firstColumn, 1, this._numColumns).setBackground('#FFFFFF');

      return {
        sucesso: true,
        mensagem: 'Registro inserido com sucesso.',
        id: novoId,
        line: insertLine
      };
    } catch (e) {
      Logger.log(`SheetModel.insert [${this._tableName}]: ${e.message}`);
      return { sucesso: false, mensagem: `Erro ao inserir registro: ${e.message}` };
    } finally {
      lock.releaseLock();
    }
  }

  /**
   * Atualiza um registro existente na planilha pelo ID
   * @param {number|string} id Identificador do registro a atualizar
   * @param {Object} dados Objeto com os campos a modificar
   * @returns {{sucesso: boolean, mensagem: string, id?: number, line?: number}}
   */
  update(id, dados) {
    if (id === null || id === undefined || String(id).trim() === '') {
      return { sucesso: false, mensagem: 'ID inválido para atualização.' };
    }

    const lock = LockService.getScriptLock();
    try {
      lock.waitLock(10000);
    } catch (e) {
      return { sucesso: false, mensagem: 'Sistema ocupado, tente novamente em instantes.' };
    }

    try {
      const registro = this.readById(id, true);
      if (!registro) {
        return { sucesso: false, mensagem: `Registro com ID ${id} não encontrado.` };
      }

      const linhaReal = Number(registro.line);
      const sheet = this.getSheet();
      const hoje = Utilities.formatDate(new Date(), this._timeZone, 'dd/MM/yyyy');

      // Se há coluna de data de alteração e não foi passada explicitamente, atualiza com hoje
      if (this._colDtAlteracao && dados.dt_alteracao === undefined && dados.dtAlteracao === undefined) {
        sheet.getRange(linhaReal, this._colDtAlteracao).setValue(hoje);
      }

      // Atualiza apenas os campos fornecidos no objeto dados
      Object.keys(dados).forEach(campo => {
        const info = this.getColumnInfo(campo);
        if (info && info.colNumber) {
          // Não sobrescreve ID na atualização
          if (info.colNumber === this._colId && (dados[campo] === undefined || dados[campo] === '')) {
            return;
          }
          const valor = dados[campo] !== undefined && dados[campo] !== null ? dados[campo] : '';
          sheet.getRange(linhaReal, info.colNumber).setValue(valor);
        }
      });

      return {
        sucesso: true,
        mensagem: 'Registro atualizado com sucesso.',
        id: Number(id) || id,
        line: linhaReal
      };
    } catch (e) {
      Logger.log(`SheetModel.update [${this._tableName}]: ${e.message}`);
      return { sucesso: false, mensagem: `Erro ao atualizar registro: ${e.message}` };
    } finally {
      lock.releaseLock();
    }
  }

  /**
   * Salva um registro: se possuir 'id' e ele já existir na planilha, executa update; senão insert.
   * @param {Object} dados
   * @returns {{sucesso: boolean, mensagem: string, modo?: string, id?: number}}
   */
  save(dados) {
    if (!dados || typeof dados !== 'object') {
      return { sucesso: false, mensagem: 'Dados inválidos para salvar.' };
    }

    const id = dados.id !== undefined && dados.id !== null && String(dados.id).trim() !== ''
      ? dados.id
      : null;

    if (id !== null && this.readById(id, true)) {
      const res = this.update(id, dados);
      return Object.assign(res, { modo: 'edicao' });
    }

    const res = this.insert(dados);
    return Object.assign(res, { modo: 'criacao' });
  }

  /**
   * Exclusão lógica (Soft Delete): preenche a data de exclusão e pinta a linha de vermelho claro (#F4CCCC).
   * @param {number|string} parId ID do registro
   * @returns {{sucesso: boolean, mensagem: string}}
   */
  excluir(parId) {
    const id = Number(parId);
    if (!Number.isInteger(id) || id <= 0) {
      return { sucesso: false, mensagem: 'ID inválido para exclusão.' };
    }

    const lock = LockService.getScriptLock();
    try {
      lock.waitLock(10000);
    } catch (e) {
      return { sucesso: false, mensagem: 'Sistema ocupado, tente novamente.' };
    }

    try {
      const registro = this.readById(id, false);
      if (!registro) {
        return { sucesso: false, mensagem: 'Registro não encontrado ou já excluído.' };
      }

      const linha = Number(registro.line);
      const dataExclusao = Utilities.formatDate(new Date(), this._timeZone, 'dd/MM/yyyy');
      const sheet = this.getSheet();

      if (this._colDtExclusao) {
        sheet.getRange(linha, this._colDtExclusao).setValue(dataExclusao);
      }

      sheet.getRange(linha, this._firstColumn, 1, this._numColumns).setBackground('#F4CCCC');

      Logger.log(`SheetModel: Registro ${id} excluído logicamente na linha ${linha} da aba ${this._tableName}`);
      return { sucesso: true, mensagem: 'Registro excluído com sucesso.' };
    } catch (e) {
      Logger.log(`SheetModel.excluir [${this._tableName}]: ${e.message}`);
      return { sucesso: false, mensagem: `Erro ao excluir o registro: ${e.message}` };
    } finally {
      lock.releaseLock();
    }
  }

  /**
   * Reativação lógica: limpa a data de exclusão e restaura o fundo branco (#FFFFFF).
   * @param {number|string} parId ID do registro
   * @returns {{sucesso: boolean, mensagem: string}}
   */
  reativar(parId) {
    const id = Number(parId);
    if (!Number.isInteger(id) || id <= 0) {
      return { sucesso: false, mensagem: 'ID inválido para reativação.' };
    }

    const lock = LockService.getScriptLock();
    try {
      lock.waitLock(10000);
    } catch (e) {
      return { sucesso: false, mensagem: 'Sistema ocupado, tente novamente.' };
    }

    try {
      const registro = this.readById(id, true);
      if (!registro) {
        return { sucesso: false, mensagem: 'Registro não encontrado para reativação.' };
      }

      const linha = Number(registro.line);
      const sheet = this.getSheet();
      const hoje = Utilities.formatDate(new Date(), this._timeZone, 'dd/MM/yyyy');

      if (this._colDtExclusao) {
        sheet.getRange(linha, this._colDtExclusao).clearContent();
      }

      if (this._colDtAlteracao) {
        sheet.getRange(linha, this._colDtAlteracao).setValue(hoje);
      }

      sheet.getRange(linha, this._firstColumn, 1, this._numColumns).setBackground('#FFFFFF');

      return { sucesso: true, mensagem: 'Registro reativado com sucesso!' };
    } catch (e) {
      Logger.log(`SheetModel.reativar [${this._tableName}]: ${e.message}`);
      return { sucesso: false, mensagem: `Erro ao reativar o registro: ${e.message}` };
    } finally {
      lock.releaseLock();
    }
  }

  // ==========================================================================
  // MÉTODOS AUXILIARES PRIVADOS
  // ==========================================================================

  /**
   * Resolve um identificador de coluna (nome, chave ou número) para um número de coluna 1-based no sheet
   * @private
   */
  _resolveColumnNumber(colIdentifier, defaultFallback = null) {
    if (colIdentifier === null || colIdentifier === undefined) {
      return defaultFallback;
    }

    // Se for string, busca nos metadados de coluna
    if (typeof colIdentifier === 'string') {
      const info = this.getColumnInfo(colIdentifier);
      return info ? info.colNumber : defaultFallback;
    }

    // Se for número
    const num = Number(colIdentifier);
    if (isNaN(num)) return defaultFallback;

    // Se passou 0, assume convenção 0-based da primeira coluna -> 1-based é firstColumn
    if (num === 0) {
      return this._firstColumn;
    }

    // Se passou número maior que o tamanho da tabela, mantém o número informado
    if (num >= this._firstColumn) {
      return num;
    }

    // Caso contrário, se for um índice 0-based pequeno, converte para 1-based
    return this._firstColumn + num;
  }

  /**
   * Calcula o próximo ID incremental da tabela
   * @private
   */
  _computeNextId(sheet) {
    const lastRow = sheet.getLastRow();
    if (lastRow < this._firstLine) {
      return 1;
    }

    const numRows = lastRow - this._firstLine + 1;
    const colIdNumber = this._colId || this._firstColumn;
    const values = sheet.getRange(this._firstLine, colIdNumber, numRows, 1).getValues();

    let maxId = 0;
    values.forEach(r => {
      const num = Number(r[0]);
      if (!isNaN(num) && num > maxId) {
        maxId = num;
      }
    });

    return maxId + 1;
  }

  /**
   * Normaliza um nome de cabeçalho para gerar uma chave de propriedade de objeto limpa
   * @private
   */
  _normalizeKey(header) {
    if (!header) return '';
    return String(header)
      .trim()
      .toLowerCase()
      .replace(/[\s\-\/\.]+/g, '_')
      .replace(/[^\w]/g, '');
  }

  /**
   * Remove acentos de uma string
   * @private
   */
  _removeAccents(str) {
    if (!str) return '';
    return String(str)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  /**
   * Formata com segurança o valor de uma célula para retornar ao cliente
   * @private
   */
  _formatCellValue(val) {
    if (val === null || val === undefined) {
      return '';
    }
    if (val instanceof Date) {
      return Utilities.formatDate(val, this._timeZone, 'dd/MM/yyyy');
    }
    return String(val).trim();
  }
}
