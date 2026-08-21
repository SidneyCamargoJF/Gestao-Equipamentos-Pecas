class EquipmentService {
  constructor() {
    this.equipmentsModel = new EquipmentsModel();
  }

  /**
   * Filtra base em critérios de busca
   */
  filtrar(criterios) {
    const dados = this.equipmentsModel.read();
    const termoBusca = (criterios && criterios.equipament) ? criterios.equipament.trim().toLowerCase() : "";

    const resultados = dados
      .filter(row => {
        const nome = row[this.equipmentsModel.colName] ? String(row[this.equipmentsModel.colName]).trim() : "";
        if (!nome) return false;
        return termoBusca === "" || nome.toLowerCase().includes(termoBusca);
      })
      .map(row => ({
        id: row[this.equipmentsModel.colId],
        equipament: String(row[this.equipmentsModel.colName]).trim(),
        desativada: String(row[this.equipmentsModel.colDtExclusao]).trim() !== ""
      }));

    return resultados.sort((a, b) => (a.desativada ? 1 : 0) - (b.desativada ? 1 : 0));
  }

  save(equipment) {
    const name = (equipment['name'] || "").toString().trim();
    if (!name) {
      return { sucesso: false, mensagem: "Digite o nome do equipamento." };
    }

    const patrimonio = (equipment['patrimonio'] || "").toString().trim();
    if (!patrimonio) {
      return { sucesso: false, mensagem: "Digite o patrimônio do equipamento"}
    }

    const id = equipment['id'];
    if (id === 0) {
      dados = equipment;

      return this.insert(dados);
    }

    return this.edit(id, equipment)
    
  }

  /**
   * Cadastra um novo equipamento ou reativa um existente
   */
  insert(equipment) {
    try {
      const sheet = this.equipmentsModel.getSheet();
      const lastRow = sheet.getLastRow();
      const dataHoje = Utilities.formatDate(new Date(), "GMT-3", "dd/MM/yyyy");

      if (lastRow >= this.equipmentsModel.firstLine) {
        const numRows = lastRow - (this.equipmentsModel.firstLine - 1);
        const dados = sheet.getRange(this.equipmentsModel.firstLine, 1, numRows, this.equipmentsModel.numColumns).getValues();
        let linhaInativaEncontrada = -1;

        for (let i = 0; i < dados.length; i++) {
          const nomeTabela = dados[i][this.equipmentsModel.colName] ? dados[i][this.equipmentsModel.colName].toString().trim().toLowerCase() : "";
          const dtExclusao = dados[i][this.equipmentsModel.colDtExclusao] ? dados[i][this.equipmentsModel.colDtExclusao].toString().trim() : "";

          if (nomeTabela === nome.toLowerCase()) {
            if (dtExclusao === "") {
              return { sucesso: false, mensagem: "Este equipamento já está cadastrado e ativo no sistema." };
            } else {
              linhaInativaEncontrada = i + this.equipmentsModel.firstLine;
            }
          }
        }

        // Reativar registro
        if (linhaInativaEncontrada !== -1) {
          sheet.getRange(linhaInativaEncontrada, this.equipmentsModel.colDtExclusao + 1).clearContent();
          sheet.getRange(linhaInativaEncontrada, this.equipmentsModel.colDtAlteracao + 1).setValue(dataHoje);
          sheet.getRange(linhaInativaEncontrada, 1, 1, this.equipmentsModel.numColumns).setBackground("#FFFFFF");
          return { sucesso: true, mensagem: "Este equipamento já existia e foi reativado com sucesso!" };
        }
      }

      // Novo ID
      let id = 1;
      if (lastRow >= this.equipmentsModel.firstLine) {
        const ultimoId = sheet.getRange(lastRow, this.equipmentsModel.colId + 1).getValue();
        id = Number(ultimoId) + 1;
      }

      sheet.appendRow([id, nome, dataHoje, "", ""]);
      const newLastRow = sheet.getLastRow();
      sheet.getRange(newLastRow, 1, 1, this.equipmentsModel.numColumns).setBackground("#FFFFFF");

      return { sucesso: true, mensagem: "Equipamento cadastrado com sucesso!" };
    } catch (e) {
      return { sucesso: false, mensagem: "Erro no servidor: " + e.message };
    }
  }

  /**
   * Edita o nome de um equipamento existente
   */
  edit(idInput, equipment) {
    const id = Number(idInput);

    if (!id) {
      return { sucesso: false, mensagem: "ID do equipamento inválido." };
    }
    if (!novoNome || novoNome.trim() === "") {
      return { sucesso: false, mensagem: "O nome do equipamento não pode ser vazio." };
    }

    try {
      const sheet = this.equipmentsModel.getSheet();
      const dados = this.equipmentsModel.readEquipments();
      let linhaLocalizada = -1;

      for (let i = 0; i < dados.length; i++) {
        if (Number(dados[i][this.equipmentsModel.colId]) === id) {
          linhaLocalizada = i + this.equipmentsModel.firstLine;
          break;
        }
      }

      if (linhaLocalizada !== -1) {
        const dataHoje = Utilities.formatDate(new Date(), "GMT-3", "dd/MM/yyyy");
        sheet.getRange(linhaLocalizada, this.equipmentsModel.colName + 1).setValue(novoNome.trim());
        sheet.getRange(linhaLocalizada, this.equipmentsModel.colDtAlteracao + 1).setValue(dataHoje);

        return {
          sucesso: true,
          mensagem: "Equipamento editado com sucesso.",
          id: id,
          equipament: novoNome.trim()
        };
      } else {
        return { sucesso: false, mensagem: "Equipamento não encontrado na planilha." };
      }
    } catch (e) {
      return { sucesso: false, mensagem: "Erro no servidor: " + e.message };
    }
  }

  /**
   * Desativa o equipamento através da chamada direta ao model
   */
  desativar(idInput) {
    return this.equipmentsModel.desativar(idInput);
  }
}

function filtrarEquipamentos(criterios) {
  const equipmentService = new EquipmentService();
  return equipmentService.filtrar()
}