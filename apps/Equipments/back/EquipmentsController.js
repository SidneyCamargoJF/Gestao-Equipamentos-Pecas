// =====================================================
// CONTROLLER - EquipmentsController.gs
// Recebe as chamadas do frontend (google.script.run),
// valida o payload e orquestra a Model.
// =====================================================

class EquipmentsController {

  constructor() {
    this.model = new EquipmentsModel();
  }

  filtrar(criterios = {}) {
    const dados = this.model.read();
    Logger.log('filtrar - dados: ')
    Logger.log(dados)
    const termo = (criterios.equipamento || '').trim().toLowerCase();

    return dados

    let res =  dados
      .filter(row => {
        const nome = row[this.model.colName] ? String(row[this.model.colName]).trim() : '';
        if (!nome) return false;
        return termo === '' || nome.toLowerCase().includes(termo);
      })
      .map(row => ({
        id: row[this.model.colId],
        patrimonio: String(row[this.model.colPatrimonio] || '').trim(),
        equipamento: String(row[this.model.colName] || '').trim(),
        marca: String(row[this.model.colBrand] || '').trim(),
        capacidade: String(row[this.model.colCapacity] || '').trim(),
        modelo: String(row[this.model.colModel] || '').trim(),
        sequencial: String(row[this.model.colSequential] || '').trim(),
        localizacao: String(row[this.model.colLocation] || '').trim(),
        desativada: String(row[this.model.colActive] || '').trim() === 'I'
      }))
      .sort((a, b) => (a.desativada ? 1 : 0) - (b.desativada ? 1 : 0));

    return res


  }

  // Único ponto de gravação (inclusão OU alteração)
  salvar(dados) {
    const retorno = this.model.save(dados || {});
    Logger.log('EquipmentsController.salvar -> ' + JSON.stringify(retorno));
    return retorno;
  }
  
  save(dados) {
    if (!dados.equipamento || dados.equipamento.trim() === '') {
      return { sucesso: false, mensagem: 'O nome do equipamento não pode ser vazio.' };
    }

    if (!dados.patrimonio || dados.patrimonio.trim() === '') {
      return { sucesso: false, mensagem: 'O patrimônio do equipamento não pode ser vazio.' };
    }

    const id = Number(dados.id);
    return id ? this.edit(id, dados) : this.insert(dados);
  }

  insert(equipment) {
    try {
      const dados = this.model.read();
      const nome = equipment.equipamento.trim().toLowerCase();
      const patrimonio = equipment.patrimonio.trim().toLowerCase();
      let linhaInativa = -1;

      for (let i = 0; i < dados.length; i++) {
        const nomeTabela = dados[i][this.model.colName] ? String(dados[i][this.model.colName]).trim().toLowerCase() : '';
        const patTabela = dados[i][this.model.colPatrimonio] ? String(dados[i][this.model.colPatrimonio]).trim().toLowerCase() : '';
        const ativo = dados[i][this.model.colActive] ? String(dados[i][this.model.colActive]).trim() : '';

        if (nomeTabela === nome && patTabela === patrimonio) {
          if (ativo !== 'I') {
            return { sucesso: false, mensagem: 'Este equipamento já está cadastrado e ativo no sistema.' };
          }
          linhaInativa = i;
        }
      }

      // Reativa registro inativo em vez de duplicar
      if (linhaInativa !== -1) {
        return this.model.status(dados[linhaInativa][this.model.colId], 'A');
      }

      const sheet = this.model.getSheet();
      const dataHoje = Utilities.formatDate(new Date(), 'GMT-3', 'dd/MM/yyyy');
      const id = this.model.getNextId();

      sheet.appendRow([
        id,
        equipment.equipamento.trim(),
        equipment.marca || '',
        equipment.capacidade || '',
        equipment.modelo || '',
        equipment.patrimonio.trim(),
        equipment.sequencial || '',
        equipment.localizacao || '',
        'A',          // colActive
        dataHoje,     // colDtCadastro
        dataHoje,     // colDtAlteracao
        ''            // colDtExclusao
      ]);

      const newLastRow = sheet.getLastRow();
      sheet.getRange(newLastRow, 1, 1, this.model.numColumns).setBackground('#FFFFFF');

      return { sucesso: true, mensagem: 'Equipamento cadastrado com sucesso!', id: id };
    } catch (e) {
      return { sucesso: false, mensagem: 'Erro no servidor: ' + e.message };
    }
  }

  edit(idInput, dados) {
    const id = Number(idInput);
    if (!id) return { sucesso: false, mensagem: 'ID do equipamento inválido.' };

    try {
      return this.model.update(id, dados);
    } catch (e) {
      return { sucesso: false, mensagem: 'Erro no servidor: ' + e.message };
    }
  }

  desativar(idInput) {
    return this.model.status(idInput, 'I');
  }

  listar() {
    return this.model.read();
  }

  buscar(id) {
    return this.model.findById(id);
  }

  filter(criterios) {
    return this.model.filter(criterios);
  }
}

// ========================================================
// Funções globais chamadas pela View via google.script.run
// ========================================================

function listarEquipamentos() {
  return new EquipmentsController().listar();
}

function buscarEquipamento(id) {
  return new EquipmentsController().buscar(id);
}

function filtrarEquipamentos(criterios) {
  return new EquipmentsController().filtrar(criterios || {});
}

function saveEquipment(dados) {
  return new EquipmentsController().salvar(dados);
}

function cadastrarEquipment(equipment) {
  return new EquipmentsController().save(equipment);
}

function editarEquipment(id, equipment) {
  return new EquipmentsController().edit(id, equipment);
}

function desativarEquipment(id) {
  return new EquipmentsController().desativar(id);
}