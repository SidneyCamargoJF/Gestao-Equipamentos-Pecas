// =====================================================
// MODEL - EquipamentoModel.gs
// Camada de acesso a dados da aba "tbl_equipamentos".
// Herda de SheetModel (classe base genérica de leitura).
// =====================================================

class EquipmentsModel extends SheetModel {

  constructor() {
    // tableName, firstLine (1ª linha onde começam os dados), firstColumn
    super('tbl_equipamentos', 3, 1); // ajuste o firstLine conforme sua aba


    this.setIdColumn(0)            // A - ID
    this.setActiveColumn(8)        // I - Active
    this.setDtCadastroColumn(9)    // J - dt_cadastro
    this.setDtAlteracaoColumn(10)  // K - dt_alteracao
    this.setDtExclusaoColumn(11)   // L - dt_exclusao

    // 12 colunas (índice base 0)
    this.setNumColumns(12)
    
    this.colNome        = 1;  // B - Nome
    this.colMarca       = 2;  // C - Marca
    this.colCapacidade  = 3;  // D - Capacidade
    this.colModelo      = 4;  // E - Modelo
    this.colPatrimonio  = 5;  // F - Patrimônio
    this.colSequencia   = 6;  // G - Sequência
    this.colLocalizacao = 7;  // H - Localização


  }

  // -----------------------------------------------------
  // Converte linha crua da planilha em objeto de domínio
  // -----------------------------------------------------
  mapLinhaParaObjeto(row, linha) {
    Logger.log('mapLinhaParaObjeto de EquipamentosModelOOP')

    return {
      row: row,
      id: linha[this.colId],
      nome: linha[this.colNome],
      marca: linha[this.colMarca],
      capacidade: linha[this.colCapacidade],
      modelo: linha[this.colModelo],
      patrimonio: linha[this.colPatrimonio],
      sequencia: linha[this.colSequencia],
      localizacao: linha[this.colLocalizacao],
      active: linha[this.colActive],
      dtCadastro: linha[this.colDtCadastro],
      dtAlteracao: linha[this.colDtAlteracao],
      dtExclusao: linha[this.colDtExclusao]
    };
  }

  // -----------------------------------------------------
  // MÓDULO SAVE ÚNICO — inclusão OU alteração.
  // Prioridade de localização: 1º por ID, 2º por Patrimônio.
  // Se o registro existir -> ALTERA; senão -> INCLUI.
  // -----------------------------------------------------
  save(dados) {
    try {
      const sheet = this.getSheet();
      const hoje = Utilities.formatDate(new Date(), 'GMT-3', 'dd/MM/yyyy');

      const id        = String(dados.id || '').trim();
      const patrimonio = String(dados.patrimonio || '').trim();

      // Validação mínima
      if (!dados.nome || !dados.marca || !dados.modelo) {
        return { sucesso: false, mensagem: 'ERRO: preencha Nome, Marca e Modelo.' };
      }

      // Monta a linha no formato físico da planilha
      const montarLinha = (idFinal, dtCadastro, dtAlteracao, dtExclusao) => [
        idFinal,
        dados.nome,
        dados.marca,
        dados.capacidade || '',
        dados.modelo,
        patrimonio,
        dados.sequencia || '',
        dados.localizacao || '',
        dados.active === false ? 'Não' : 'Sim',
        dtCadastro,
        dtAlteracao,
        dtExclusao
      ];

      const dadosTabela = sheet.getDataRange().getValues();

      // ---- MODO ALTERAÇÃO: localiza o registro ----
      const linhaEncontrada = this.localizarLinha(dadosTabela, id, patrimonio);
      if (linhaEncontrada !== -1) {
        const dtCadastroOriginal = dadosTabela[linhaEncontrada][this.colDtCadastro];
        const dtExclusaoOriginal = dadosTabela[linhaEncontrada][this.colDtExclusao];
        const idExistente = dadosTabela[linhaEncontrada][this.colId];

        const linhaAtualizada = montarLinha(idExistente, dtCadastroOriginal, hoje, dtExclusaoOriginal);
        sheet.getRange(linhaEncontrada + 1, 1, 1, this.numColumns).setValues([linhaAtualizada]);
        return { sucesso: true, mensagem: 'Equipamento ATUALIZADO com sucesso!', modo: 'edicao', id: idExistente };
      }

      // ---- MODO INCLUSÃO: calcula o próximo ID e insere ----
      const ultimaLinha = Math.max(sheet.getLastRow(), this.firstLine - 1);
      let novoId;
      if (ultimaLinha < this.firstLine) {
        novoId = 1; // nenhum registro ainda
      } else {
        let idAtual = sheet.getRange(ultimaLinha, 1).getValue();
        if (idAtual === '' || idAtual === 'ID' || isNaN(Number(idAtual))) idAtual = 0;
        novoId = Number(idAtual) + 1;
      }

      const novaLinha = montarLinha(novoId, hoje, '', '');
      sheet.getRange(ultimaLinha + 1, 1, 1, this.numColumns).setValues([novaLinha]);
      return { sucesso: true, mensagem: 'Equipamento CADASTRADO com sucesso!', modo: 'criacao', id: novoId };

    } catch (e) {
      Logger.log('Erro em EquipamentoModel.save: ' + e.message);
      return { sucesso: false, mensagem: 'Erro no servidor: ' + e.message };
    }
  }

  // -----------------------------------------------------
  // Auxiliar: procura a linha (índice 0-based) por ID ou
  // por Patrimônio. Retorna -1 se não encontrar.
  // -----------------------------------------------------
  localizarLinha(dadosTabela, id, patrimonio) {
    for (let i = this.firstLine - 1; i < dadosTabela.length; i++) {
      if (id !== '' && String(dadosTabela[i][this.colId] || '').trim() === id) {
        return i;
      }
      if (patrimonio !== '' && String(dadosTabela[i][this.colPatrimonio] || '').trim() === patrimonio) {
        return i;
      }
    }
    return -1;
  }

  // -----------------------------------------------------
  // Busca por ID
  // -----------------------------------------------------
  findById(id) {
    const idBuscado = String(id || '').trim();
    if (idBuscado === '') return null;
    const dados = this.readAll(this.numColumns);
    for (const linha of dados) {
      if (String(linha[this.colId] || '').trim() === idBuscado) {
        return this.mapLinhaParaObjeto(linha);
      }
    }
    return null;
  }

  // -----------------------------------------------------
  // Filtro dinâmico por Nome, Marca, Localização, Status
  // -----------------------------------------------------
  filtrar(criterios) {
    criterios = criterios || {};
    const sNome       = String(criterios.nome || '').trim().toLowerCase();
    const sMarca      = String(criterios.marca || '').trim().toLowerCase();
    const sLocalizacao = String(criterios.localizacao || '').trim().toLowerCase();
    const sStatus     = String(criterios.status || '').trim().toLowerCase();

    return this.read().filter(eq => {
      const nomeOk  = sNome === '' || String(eq.nome || '').toLowerCase().includes(sNome);
      const marcaOk = sMarca === '' || String(eq.marca || '').toLowerCase().includes(sMarca);
      const locOk   = sLocalizacao === '' || String(eq.localizacao || '').toLowerCase().includes(sLocalizacao);
      const statusOk = sStatus === '' || String(eq.active || '').toLowerCase() === sStatus;
      return nomeOk && marcaOk && locOk && statusOk;
    });
  }

}