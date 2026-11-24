function ReadLocalizacoesCompleto() {
  const objRows = ReadSheet(LocalTableName, firstLineLocal, numColumnsLocal);
  return objRows.map(linha => linha.map(valor => (valor instanceof Date) ? dateToString(valor) : valor));
}

function filtrarLocalizacoes(criterios) {
  const dados = ReadLocalizacoesCompleto();
  const nomeBuscado = (criterios && criterios.nome) ? String(criterios.nome).trim().toLowerCase() : '';
  const res = [];

  dados.forEach(linha => {
    const nome = String(linha[localNameCol - 1] || '').trim();
    if (!nome) return;
    if (nomeBuscado && !nome.toLowerCase().includes(nomeBuscado)) return;

    res.push({
      id: linha[localIdCol - 1],
      nome: nome,
      observacao: String(linha[localObservacaoCol - 1] || '').trim(),
      desativada: !!String(linha[LocalDtExclusaoCol - 1] || '').trim()
    });
  });

  res.sort((a, b) => (a.desativada ? 1 : 0) - (b.desativada ? 1 : 0));
  return res;
}

/**
 * Cadastro completo (nome + observação), com edição e exclusão -- usado
 * pela tela de Localizações. Reativa se achar uma localização desativada
 * com o mesmo nome (mesmo padrão de cadastrarMarca()).
 */
function cadastrarLocalizacaoCompleta(nomeInput, observacaoInput) {
  try {
    const nome = (nomeInput || '').toString().trim();
    if (!nome) return { sucesso: false, mensagem: 'Digite o nome da localização.' };
    const observacao = (observacaoInput || '').toString().trim();

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const aba = ss.getSheetByName(LocalTableName);
    if (!aba) return { sucesso: false, mensagem: "Aba '" + LocalTableName + "' não foi encontrada na planilha." };

    const dados = ReadLocalizacoesCompleto();
    const idxExistente = dados.findIndex(l => String(l[localNameCol - 1] || '').trim().toLowerCase() === nome.toLowerCase());
    const dataHoje = Utilities.formatDate(new Date(), 'GMT-3', 'dd/MM/yyyy');

    if (idxExistente !== -1) {
      const existente = dados[idxExistente];
      const estaDesativada = !!String(existente[LocalDtExclusaoCol - 1] || '').trim();
      if (!estaDesativada) {
        return { sucesso: false, mensagem: 'Esta localização já está cadastrada.' };
      }
      const linhaReal = idxExistente + firstLineLocal;
      aba.getRange(linhaReal, localObservacaoCol).setValue(observacao);
      aba.getRange(linhaReal, LocalDtExclusaoCol).clearContent();
      aba.getRange(linhaReal, LocalDtAlteracao).setValue(dataHoje);
      aba.getRange(linhaReal, 1, 1, numColumnsLocal).setBackground('#FFFFFF');
      return { sucesso: true, mensagem: 'Esta localização já existia e foi reativada com sucesso!' };
    }

    const ultimaLinha = aba.getLastRow();
    let novoId = 1;
    if (ultimaLinha >= firstLineLocal) {
      const ultimoId = aba.getRange(ultimaLinha, localIdCol).getValue();
      novoId = isNaN(Number(ultimoId)) ? 1 : Number(ultimoId) + 1;
    }

    const novaLinha = [];
    novaLinha[localIdCol - 1] = novoId;
    novaLinha[localNameCol - 1] = nome;
    novaLinha[localDtCadastroCol - 1] = dataHoje;
    novaLinha[LocalDtExclusaoCol - 1] = '';
    novaLinha[LocalDtAlteracao - 1] = '';
    novaLinha[localObservacaoCol - 1] = observacao;

    aba.appendRow(novaLinha);
    return { sucesso: true, mensagem: 'Localização cadastrada com sucesso!', id: novoId };
  } catch (e) {
    return { sucesso: false, mensagem: 'Erro no servidor: ' + e.message };
  }
}

function editarLocalizacao(idInput, novoNome, novaObservacao) {
  try {
    const id = Number(idInput);
    if (!id) return { sucesso: false, mensagem: 'ID da localização inválido.' };
    const nome = (novoNome || '').toString().trim();
    if (!nome) return { sucesso: false, mensagem: 'O nome da localização não pode ser vazio.' };
    const observacao = (novaObservacao || '').toString().trim();

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const aba = ss.getSheetByName(LocalTableName);
    if (!aba) return { sucesso: false, mensagem: "Aba '" + LocalTableName + "' não foi encontrada na planilha." };

    const dados = ReadLocalizacoesCompleto();
    const idx = dados.findIndex(l => Number(l[localIdCol - 1]) === id);
    if (idx === -1) return { sucesso: false, mensagem: 'Localização não encontrada.' };

    const linhaReal = idx + firstLineLocal;
    const dataHoje = Utilities.formatDate(new Date(), 'GMT-3', 'dd/MM/yyyy');

    aba.getRange(linhaReal, localNameCol).setValue(nome);
    aba.getRange(linhaReal, localObservacaoCol).setValue(observacao);
    aba.getRange(linhaReal, LocalDtAlteracao).setValue(dataHoje);

    return { sucesso: true, mensagem: 'Localização editada com sucesso.', id: id, nome: nome, observacao: observacao };
  } catch (e) {
    return { sucesso: false, mensagem: 'Erro no servidor: ' + e.message };
  }
}

/** Usada por ExcluirRegistro('tbl_localizacao', id) -- ver Model.js. */
function desativarLocalizacao(idInput) {
  try {
    const id = Number(idInput);
    if (!id) return { sucesso: false, mensagem: 'ID da localização inválido.' };

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const aba = ss.getSheetByName(LocalTableName);
    if (!aba) return { sucesso: false, mensagem: "Aba '" + LocalTableName + "' não foi encontrada na planilha." };

    const dados = ReadLocalizacoesCompleto();
    const idx = dados.findIndex(l => Number(l[localIdCol - 1]) === id);
    if (idx === -1) return { sucesso: false, mensagem: 'Localização não encontrada (ou já desativada).' };

    const linhaReal = idx + firstLineLocal;
    const dataHoje = Utilities.formatDate(new Date(), 'GMT-3', 'dd/MM/yyyy');

    aba.getRange(linhaReal, LocalDtExclusaoCol).setValue(dataHoje);
    aba.getRange(linhaReal, LocalDtAlteracao).setValue(dataHoje);
    aba.getRange(linhaReal, 1, 1, numColumnsLocal).setBackground('#F4CCCC');

    return { sucesso: true, mensagem: 'Localização desativada com sucesso.' };
  } catch (e) {
    return { sucesso: false, mensagem: 'Erro no servidor: ' + e.message };
  }
}

/** Reativa uma localização desativada: limpa DT_EXCLUSAO, atualiza DT_ALTERACAO. */
function reativarLocalizacao(idInput) {
  try {
    const id = Number(idInput);
    if (!id) return { sucesso: false, mensagem: 'ID da localização inválido.' };

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const aba = ss.getSheetByName(LocalTableName);
    if (!aba) return { sucesso: false, mensagem: "Aba '" + LocalTableName + "' não foi encontrada na planilha." };

    const dados = ReadLocalizacoesCompleto();
    const idx = dados.findIndex(l => Number(l[localIdCol - 1]) === id);
    if (idx === -1) return { sucesso: false, mensagem: 'Localização não encontrada.' };

    const linhaReal = idx + firstLineLocal;
    const dataHoje = Utilities.formatDate(new Date(), 'GMT-3', 'dd/MM/yyyy');

    aba.getRange(linhaReal, LocalDtExclusaoCol).clearContent();
    aba.getRange(linhaReal, LocalDtAlteracao).setValue(dataHoje);
    aba.getRange(linhaReal, 1, 1, numColumnsLocal).setBackground('#FFFFFF');

    return { sucesso: true, mensagem: 'Localização reativada com sucesso.' };
  } catch (e) {
    return { sucesso: false, mensagem: 'Erro no servidor: ' + e.message };
  }
}
