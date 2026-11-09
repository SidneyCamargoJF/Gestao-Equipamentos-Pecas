function filtrarUsuarios(criterios) {
  const dados = ReadUsers();
  const busca = (criterios && criterios.nome) ? criterios.nome.trim().toLowerCase() : "";
  const res = [];

  for (let i = 0; i < dados.length; i++) {
    const nome = dados[i][userNomeCol] ? String(dados[i][userNomeCol]).trim() : "";
    if (!nome) continue;

    if (busca && !nome.toLowerCase().includes(busca)) continue;

    res.push({
      id: dados[i][userIdCol],
      matricula: dados[i][userMatriculaCol] ? String(dados[i][userMatriculaCol]).trim() : "",
      nome: nome,
      lotacao: dados[i][userLotacao] ? String(dados[i][userLotacao]).trim() : "",
      setor: dados[i][userSetorCol] ? String(dados[i][userSetorCol]).trim() : "",
      desativado: String(dados[i][userDtExclusaoCol] || "").trim() !== ""
    });
  }

  res.sort((a, b) => (a.desativado ? 1 : 0) - (b.desativado ? 1 : 0));

  return res;
}

function cadastrarUsuario(matriculaInput, nomeInput, lotacaoInput, setorInput) {
  try {
    const matricula = (matriculaInput || "").toString().trim();
    const nome = (nomeInput || "").toString().trim();
    const lotacao = (lotacaoInput || "").toString().trim();
    const setor = (setorInput || "").toString().trim();

    if (matricula === "") {
      return { sucesso: false, mensagem: "Digite a matrícula." };
    }
    if (nome === "") {
      return { sucesso: false, mensagem: "Digite o nome do usuário." };
    }
    if (lotacao === "") {
      return { sucesso: false, mensagem: "Digite a lotação." };
    }
    if (setor === "") {
      return { sucesso: false, mensagem: "Digite o setor." };
    }

    const planilha = SpreadsheetApp.getActiveSpreadsheet();
    const aba = planilha.getSheetByName(userTableName);

    if (!aba) {
      return { sucesso: false, mensagem: "Aba '" + userTableName + "' não foi encontrada na planilha." };
    }

    const ultimaLinha = aba.getLastRow();
    const dataHoje = Utilities.formatDate(new Date(), "GMT-3", "dd/MM/yyyy");

    let id = 1;
    if (ultimaLinha >= firstLineUsers) {
      const ultimoId = aba.getRange(ultimaLinha, userIdCol + 1).getValue();
      id = Number(ultimoId) + 1;
    }

    // [ID, Matrícula, Nome, Lotação, Setor, Data Cadastro, Data Exclusão]
    aba.appendRow([id, matricula, nome, lotacao, setor, dataHoje, ""]);

    return { sucesso: true, mensagem: "Usuário cadastrado com sucesso!" };

  } catch (e) {
    return { sucesso: false, mensagem: "Erro no servidor: " + e.message };
  }
}

function desativarUsuario(idInput) {
  try {
    const id = Number(idInput);
    if (!id) {
      return { sucesso: false, mensagem: "ID do usuário inválido." };
    }

    const planilha = SpreadsheetApp.getActiveSpreadsheet();
    const aba = planilha.getSheetByName(userTableName);
    if (!aba) {
      return { sucesso: false, mensagem: "Aba '" + userTableName + "' não foi encontrada." };
    }

    const dados = ReadUsers();
    let linha = -1;
    for (let i = 0; i < dados.length; i++) {
      if (Number(dados[i][userIdCol]) === id) { linha = i + firstLineUsers; break; }
    }
    if (linha === -1) {
      return { sucesso: false, mensagem: "Usuário não encontrado." };
    }

    const dataHoje = Utilities.formatDate(new Date(), "GMT-3", "dd/MM/yyyy");
    aba.getRange(linha, userDtExclusaoCol + 1).setValue(dataHoje);

    return { sucesso: true, mensagem: "Usuário desativado com sucesso!" };

  } catch (e) {
    return { sucesso: false, mensagem: "Erro no servidor: " + e.message };
  }
}

function reativarUsuario(idInput) {
  try {
    const id = Number(idInput);
    if (!id) {
      return { sucesso: false, mensagem: "ID do usuário inválido." };
    }

    const planilha = SpreadsheetApp.getActiveSpreadsheet();
    const aba = planilha.getSheetByName(userTableName);
    if (!aba) {
      return { sucesso: false, mensagem: "Aba '" + userTableName + "' não foi encontrada." };
    }

    const dados = ReadUsers();
    let linha = -1;
    for (let i = 0; i < dados.length; i++) {
      if (Number(dados[i][userIdCol]) === id) { linha = i + firstLineUsers; break; }
    }
    if (linha === -1) {
      return { sucesso: false, mensagem: "Usuário não encontrado." };
    }

    aba.getRange(linha, userDtExclusaoCol + 1).clearContent();

    return { sucesso: true, mensagem: "Usuário reativado com sucesso!" };

  } catch (e) {
    return { sucesso: false, mensagem: "Erro no servidor: " + e.message };
  }
}
