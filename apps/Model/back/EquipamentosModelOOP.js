class EquipmentsModel extends SheetModel {
  constructor() {
    // Inicializa a classe pai (SheetModel) com a aba e linha inicial
    super('tbl_equipments', 3, 1);  // constructor(sheetName, firstLine, firstColumn)

    // Mapeamento de colunas e limites
    this.numColumns = 5;
    this.colId = 0;
    this.colName = 1;
    this.colDtCadastro = 2;
    this.colDtExclusao = 3;
    this.colDtAlteracao = 4;
  }

  /**
   * Lê todos os equipamentos e formata as colunas de data
   */
  read() {
    const rows = this.readAll(this.numColumns);

    return rows.map(item => {
      item[this.colDtCadastro] = typeof isEmpty === 'function' && isEmpty(item[this.colDtCadastro]) ? "" : this.formatDate(item[this.colDtCadastro]);
      item[this.colDtExclusao] = typeof isEmpty === 'function' && isEmpty(item[this.colDtExclusao]) ? "" : this.formatDate(item[this.colDtExclusao]);
      item[this.colDtAlteracao] = typeof isEmpty === 'function' && isEmpty(item[this.colDtAlteracao]) ? "" : this.formatDate(item[this.colDtAlteracao]);
      return item;
    });
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
   * Desativa um equipamento/marca aplicando preenchimento e data de exclusão
   */
  desativar(idInput) {
    try {
      const id = Number(idInput);
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
}