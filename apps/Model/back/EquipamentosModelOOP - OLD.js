class EquipmentsModel extends SheetModel {
  constructor() {
    // Inicializa a classe pai (SheetModel) com a aba e linha inicial
    super('tbl_equipments', 3, 1);  // constructor(sheetName, firstLine, firstColumn)

    // Mapeamento de colunas e limites
    this.numColumns = 10;
    this.colId = 0;
    this.colName = 1;
    this.colBrand = 2;
    this.colCapacity = 3;
    this.colModel = 4;
    this.colPatrimonio = 5;
    this.colSequential = 6;
    this.colLocation = 7;
    this.colActive = 8;
    this.colDtCadastro = 9;
    this.colDtAlteracao = 10;
    this.colDtExclusao = 11;

  }

  /**
   * Lê todos os equipamentos e formata as colunas de data
   */
  read() {
    const rows = this.readAll(this.numColumns);

    return rows.map(item => {
      item[this.colName] = typeof isEmpty === 'function' && isEmpty(item[this.colName]) ? "" : item[this.colName];

      item[this.colDtCadastro] = typeof isEmpty === 'function' && isEmpty(item[this.colDtCadastro]) ? "" : this.formatDate(item[this.colDtCadastro]);
      item[this.colDtExclusao] = typeof isEmpty === 'function' && isEmpty(item[this.colDtExclusao]) ? "" : this.formatDate(item[this.colDtExclusao]);
      item[this.colDtAlteracao] = typeof isEmpty === 'function' && isEmpty(item[this.colDtAlteracao]) ? "" : this.formatDate(item[this.colDtAlteracao]);
    });

    return rows;
  }

  /**
   * Função auxiliar para formatação de data
   */
  formatDate(val) {
    if (!val) return "";
    return typeof dateToString === 'function' ? dateToString(val) : String(val);
  }

  /**
   * Busca um ID exato na planilha
   */
  findId(id) {
    const cell = this.searchContext(id, true, this.numColumns);
    return cell ? cell.getRow() : null;
  }

  /**
   * Busca um equipamento por campo específico ou no escopo geral
   */
  find(columnName, context) {
    switch (columnName) {
      case 'id':
        return this.searchContext(context, true, this.colId + 1);
      case 'name':
      case 'nome':
        return this.searchContext(context, true, this.colName + 1);
      default:
        return this.searchContext(context, false, this.numColumns);
    }
  }

  /**
   * Exclui um equipamento/marca aplicando preenchimento e data de exclusão
   */
  delete(par_id) {
    try {
      const id = Number(par_id);
      if (!id) {
        return { sucesso: false, mensagem: "ID inválido." };
      }

      const sheet = this.getSheet();
      const dados = this.read();
      let linhaLocalizada = -1;

      for (let i = 0; i < dados.length; i++) {
        const idTabela = Number(dados[i][this.colId]);
        const dataExclusao = dados[i][this.colDtExclusao] ? String(dados[i][this.colDtExclusao]).trim() : "";

        if (idTabela === id && dataExclusao === "") {
          linhaLocalizada = i + this.firstLine;
          break;
        }
      }

      if (linhaLocalizada !== -1) {
        const dataHoje = Utilities.formatDate(new Date(), "GMT-3", "dd/MM/yyyy");

        // Atualiza a data de exclusão (coluna 4/index colDtExclusao+1) e cor de fundo
        sheet.getRange(linhaLocalizada, this.colDtExclusao + 1).setValue(dataHoje);
        sheet.getRange(linhaLocalizada, 1, 1, 4).setBackground("#F4CCCC");

        Logger.log(`Equipamento ID ${id} desativado na linha ${linhaLocalizada}`);
        return { sucesso: true, mensagem: "Equipamento desativado com sucesso." };
      } else {
        Logger.log(`Equipamento ativo não encontrado para o ID: ${id}`);
        return { sucesso: false, mensagem: "Equipamento ativo não encontrado." };
      }
    } catch (e) {
      Logger.log(`Erro ao desativar equipamento: ${e.message}`);
      return { sucesso: false, mensagem: `Erro no servidor: ${e.message}` };
    }
  }

  /**
   * Exclui um equipamento/marca aplicando preenchimento e data de exclusão
   */
  status(par_id, par_status) {
    try {
      const id = Number(par_id);
      if (!id) {
        return { sucesso: false, mensagem: "ID inválido." };
      }

      const sheet = this.getSheet();
      const dados = this.read();
      let linhaLocalizada = -1;

      for (let i = 0; i < dados.length; i++) {
        const idTabela = Number(dados[i][this.colId]);

        if (idTabela === id && dataExclusao === "") {
          linhaLocalizada = i + this.firstLine;
          break;
        }
      }

      if (linhaLocalizada !== -1) {
        // Atualiza a data de exclusão (coluna 4/index colDtExclusao+1) e cor de fundo
        sheet.getRange(linhaLocalizada, this.colActive).setValue(par_status);
        if (par_status === 'I') {
          sheet.getRange(linhaLocalizada, 1, 1, 4).setBackground("#F4CCCC");
          Logger.log(`Equipamento ID ${id} desativado na linha ${linhaLocalizada}`);
          return { sucesso: true, mensagem: "Equipamento desativado com sucesso." };
        }

      } else {
        Logger.log(`Equipamento não encontrado para o ID: ${id}`);
        return { sucesso: false, mensagem: "Equipamento não encontrado." };
      }
    } catch (e) {
      Logger.log(`Erro ao alterar o status do equipamento: ${e.message}`);
      return { sucesso: false, mensagem: `Erro no servidor: ${e.message}` };
    }
  }
}