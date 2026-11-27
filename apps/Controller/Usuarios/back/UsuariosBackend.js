// Gestão de usuários: só administrador e diretor (LoginBackend). Ninguém
// mexe em quem está num nível acima do seu.
function gestorUsuarios_() {
  const s = sessaoAtual_();
  return s && s.nivel >= 2 ? s : null;
}

function alvoAcimaDoGestor_(linha, gestor) {
  return GRUPOS_USUARIO[grupoUsuarioLinha_(linha)] > gestor.nivel;
}

function filtrarUsuarios(criterios) {
  const gestor = gestorUsuarios_();
  if (!gestor) return [];
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
      usuario: dados[i][userUsuarioCol] ? String(dados[i][userUsuarioCol]).trim() : "",
      nome: nome,
      lotacao: dados[i][userLotacao] ? String(dados[i][userLotacao]).trim() : "",
      setor: dados[i][userSetorCol] ? String(dados[i][userSetorCol]).trim() : "",
      email: dados[i][userEmailCol] ? String(dados[i][userEmailCol]).trim() : "",
      telefone: dados[i][userTelefoneCol] ? String(dados[i][userTelefoneCol]).trim() : "",
      desativado: String(dados[i][userDtExclusaoCol] || "").trim() !== "",
      grupo: grupoUsuarioLinha_(dados[i]),
      ativo: String(dados[i][userAtivoCol] || "S").trim().toUpperCase() !== "N",
      temSenha: String(dados[i][userSenhaHashCol] || "") !== "",
      ultimoAcesso: String(dados[i][userUltimoAcessoCol] || ""),
      voceMesmo: Number(dados[i][userIdCol]) === gestor.id,
      podeGerenciar: Number(dados[i][userIdCol]) !== gestor.id && GRUPOS_USUARIO[grupoUsuarioLinha_(dados[i])] <= gestor.nivel
    });
  }

  // aguardando liberação primeiro; desativados por último
  const ordem = u => u.desativado ? 2 : (u.ativo ? 1 : 0);
  res.sort((a, b) => ordem(a) - ordem(b));

  return res;
}

function cadastrarUsuario(matriculaInput, usuarioInput, nomeInput, lotacaoInput, setorInput, emailInput, telefoneInput, grupoInput) {
  try {
    const gestor = gestorUsuarios_();
    if (!gestor) return { sucesso: false, mensagem: "Somente administradores e diretores podem cadastrar usuários." };
    const grupo = String(grupoInput || "usuario").toLowerCase();
    if (!GRUPOS_USUARIO[grupo]) return { sucesso: false, mensagem: "Grupo inválido." };
    if (GRUPOS_USUARIO[grupo] > gestor.nivel) return { sucesso: false, mensagem: "Você não pode dar um nível acima do seu." };
    return executarComLock(function () {
      return cadastrarUsuario_(matriculaInput, usuarioInput, nomeInput, lotacaoInput, setorInput, emailInput, telefoneInput, grupo);
    });
  } catch (e) {
    return { sucesso: false, mensagem: "Erro no servidor: " + e.message };
  }
}

/**
 * Confere os campos do usuário. { mensagem } se algo estiver errado, ou
 * { dados } com os valores limpos. E-mail e telefone/ramal são opcionais
 * (o e-mail é validado).
 */
function validarCamposUsuario_(matriculaInput, usuarioInput, nomeInput, lotacaoInput, setorInput, emailInput, telefoneInput) {
  const d = {
    matricula: (matriculaInput || "").toString().trim(),
    usuario: (usuarioInput || "").toString().trim().toLowerCase(),
    nome: (nomeInput || "").toString().trim(),
    lotacao: (lotacaoInput || "").toString().trim(),
    setor: (setorInput || "").toString().trim(),
    email: (emailInput || "").toString().trim().toLowerCase(),
    telefone: (telefoneInput || "").toString().trim()
  };
  if (d.matricula === "") return { mensagem: "Digite a matrícula." };
  if (d.usuario === "") return { mensagem: "Digite o usuário." };
  if (d.nome === "") return { mensagem: "Digite o nome do usuário." };
  if (d.lotacao === "") return { mensagem: "Digite a lotação." };
  if (d.setor === "") return { mensagem: "Digite o setor." };
  if (d.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) return { mensagem: "E-mail inválido." };
  return { dados: d };
}

/**
 * Altera um usuário ativo. dados: { matricula, usuario, nome, lotacao,
 * setor, email }. Não mexe nas datas de cadastro e exclusão.
 */
function alterarUsuario(idInput, dadosInput) {
  try {
    const gestor = gestorUsuarios_();
    if (!gestor) return { sucesso: false, mensagem: "Somente administradores e diretores podem alterar usuários." };
    return executarComLock(function () {
      const id = Number(idInput);
      if (!id) return { sucesso: false, mensagem: "ID do usuário inválido." };
      const d0 = dadosInput || {};
      const v = validarCamposUsuario_(d0.matricula, d0.usuario, d0.nome, d0.lotacao, d0.setor, d0.email, d0.telefone);
      if (v.mensagem) return { sucesso: false, mensagem: v.mensagem };
      const d = v.dados;

      const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(userTableName);
      if (!aba) return { sucesso: false, mensagem: "Aba '" + userTableName + "' não foi encontrada." };

      const lista = ReadUsers();
      const idx = lista.findIndex(function (l) { return Number(l[userIdCol]) === id; });
      if (idx === -1) return { sucesso: false, mensagem: "Usuário não encontrado." };
      if (String(lista[idx][userDtExclusaoCol] || "").trim()) return { sucesso: false, mensagem: "Usuário desativado: reative antes de alterar." };
      if (alvoAcimaDoGestor_(lista[idx], gestor)) return { sucesso: false, mensagem: "Você não pode alterar um usuário de nível acima do seu." };

      const repetido = lista.some(function (l) {
        return Number(l[userIdCol]) !== id && !String(l[userDtExclusaoCol] || "").trim() &&
          chaveUsuarioLogin_(l[userUsuarioCol]) === chaveUsuarioLogin_(d.usuario);
      });
      if (repetido) return { sucesso: false, mensagem: "Já existe outro usuário ativo com esse login." };

      const linha = idx + firstLineUsers;
      aba.getRange(linha, userMatriculaCol + 1, 1, 5).setValues([[d.matricula, d.usuario, d.nome, d.lotacao, d.setor]]);
      aba.getRange(linha, userEmailCol + 1, 1, 2).setValues([[d.email, d.telefone]]);
      return { sucesso: true, mensagem: "Usuário alterado com sucesso!" };
    });
  } catch (e) {
    return { sucesso: false, mensagem: "Erro no servidor: " + e.message };
  }
}

function cadastrarUsuario_(matriculaInput, usuarioInput, nomeInput, lotacaoInput, setorInput, emailInput, telefoneInput, grupoInput) {
  try {
    const v = validarCamposUsuario_(matriculaInput, usuarioInput, nomeInput, lotacaoInput, setorInput, emailInput, telefoneInput);
    if (v.mensagem) return { sucesso: false, mensagem: v.mensagem };
    const matricula = v.dados.matricula, usuario = v.dados.usuario, nome = v.dados.nome,
      lotacao = v.dados.lotacao, setor = v.dados.setor, email = v.dados.email, telefone = v.dados.telefone;

    const planilha = SpreadsheetApp.getActiveSpreadsheet();
    const aba = planilha.getSheetByName(userTableName);

    if (!aba) {
      return { sucesso: false, mensagem: "Aba '" + userTableName + "' não foi encontrada na planilha." };
    }

    const jaExiste = ReadUsers().some(function (l) {
      return !String(l[userDtExclusaoCol] || "").trim() && chaveUsuarioLogin_(l[userUsuarioCol]) === chaveUsuarioLogin_(usuario);
    });
    if (jaExiste) {
      return { sucesso: false, mensagem: "Já existe um usuário ativo com esse login." };
    }

    const dataHoje = Utilities.formatDate(new Date(), "GMT-3", "dd/MM/yyyy");
    const pos = proximoIdTabela(aba, firstLineUsers);

    // [ID, Matrícula, Usuário, Nome, Lotação, Setor, Data Cadastro, Data Exclusão, E-mail, Telefone/ramal,
    //  senha (vazia: a pessoa define em "Esqueci minha senha"), sal, grupo, ativo, código, validade, último acesso]
    const linha = [pos.novoId, matricula, usuario, nome, lotacao, setor, dataHoje, "", email || (/@/.test(usuario) ? usuario : ""), telefone,
      "", "", grupoInput || "usuario", "S", "", "", ""];
    aba.getRange(pos.proximaLinha, 1, 1, numColumnsUsers).setValues([linha]);

    return { sucesso: true, mensagem: "Usuário cadastrado com sucesso! Para entrar, ele define a senha em \"Esqueci minha senha\" na tela de login." };

  } catch (e) {
    return { sucesso: false, mensagem: "Erro no servidor: " + e.message };
  }
}

function desativarUsuario(idInput) {
  try {
    const gestor = gestorUsuarios_();
    if (!gestor) return { sucesso: false, mensagem: "Somente administradores e diretores podem desativar usuários." };
    const id = Number(idInput);
    if (!id) {
      return { sucesso: false, mensagem: "ID do usuário inválido." };
    }
    if (id === gestor.id) return { sucesso: false, mensagem: "Você não pode desativar o seu próprio usuário." };

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
    if (alvoAcimaDoGestor_(dados[linha - firstLineUsers], gestor)) return { sucesso: false, mensagem: "Você não pode desativar um usuário de nível acima do seu." };

    const dataHoje = Utilities.formatDate(new Date(), "GMT-3", "dd/MM/yyyy");
    aba.getRange(linha, userDtExclusaoCol + 1).setValue(dataHoje);

    return { sucesso: true, mensagem: "Usuário desativado com sucesso!" };

  } catch (e) {
    return { sucesso: false, mensagem: "Erro no servidor: " + e.message };
  }
}

function reativarUsuario(idInput) {
  try {
    const gestor = gestorUsuarios_();
    if (!gestor) return { sucesso: false, mensagem: "Somente administradores e diretores podem reativar usuários." };
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

    if (alvoAcimaDoGestor_(dados[linha - firstLineUsers], gestor)) return { sucesso: false, mensagem: "Você não pode reativar um usuário de nível acima do seu." };
    aba.getRange(linha, userDtExclusaoCol + 1).clearContent();

    return { sucesso: true, mensagem: "Usuário reativado com sucesso!" };

  } catch (e) {
    return { sucesso: false, mensagem: "Erro no servidor: " + e.message };
  }
}

// =====================================================
// USUÁRIO LOGADO
// O web app roda como USER_ACCESSING (domínio), então
// Session.getActiveUser().getEmail() devolve o e-mail de quem está usando.
// A coluna USUARIO de tbl_usuarios pode ter o e-mail completo ou só o
// login (parte antes do @) -- os dois casam.
// =====================================================
function chaveUsuarioLogin_(valor) {
  return String(valor || '').trim().toLowerCase().split('@')[0];
}

function emailUsuarioLogado_() {
  try {
    return String(Session.getActiveUser().getEmail() || '').trim().toLowerCase();
  } catch (e) {
    return '';
  }
}

/**
 * { email, nome, encontrado, setor, lotacao, emailContato, telefone } do
 * usuário logado. nome cai no e-mail se ele não estiver cadastrado;
 * emailContato é o e-mail do cadastro ou, vazio, o da conta Google.
 */
function buscarUsuarioLogado() {
  const s = typeof sessaoAtual_ === 'function' ? sessaoAtual_() : null;
  if (s) {
    return { email: s.email || emailUsuarioLogado_(), nome: s.nome, encontrado: true, setor: s.setor, lotacao: s.lotacao,
      emailContato: s.email || emailUsuarioLogado_(), telefone: s.telefone || '', grupo: s.grupo, grupoTexto: NOMES_GRUPOS[s.grupo], usuario: s.usuario };
  }
  const email = emailUsuarioLogado_();
  if (!email) return { email: '', nome: '', encontrado: false, setor: '', lotacao: '', emailContato: '', telefone: '' };

  const chave = chaveUsuarioLogin_(email);
  const linha = ReadUsers().find(function (l) {
    return !String(l[userDtExclusaoCol] || '').trim() && chaveUsuarioLogin_(l[userUsuarioCol]) === chave;
  });
  return linha
    ? {
      email: email, nome: String(linha[userNomeCol] || '').trim() || email, encontrado: true,
      setor: String(linha[userSetorCol] || '').trim(), lotacao: String(linha[userLotacao] || '').trim(),
      emailContato: String(linha[userEmailCol] || '').trim() || email, telefone: String(linha[userTelefoneCol] || '').trim()
    }
    : { email: email, nome: email, encontrado: false, setor: '', lotacao: '', emailContato: email, telefone: '' };
}

/** Texto gravado em "Aberto por"/"Registrado por". */
function nomeUsuarioLogado() {
  return buscarUsuarioLogado().nome || 'Desconhecido';
}
