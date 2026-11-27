// =====================================================
// LOGIN, GRUPOS DE USUÁRIOS E PERMISSÕES DE MENU
// - Login com usuário e senha (tbl_usuarios). A senha fica só como hash
//   (SHA-256 com sal, várias rodadas). Mensagem genérica "Senha incorreta."
//   quando o usuário não existe OU a senha não confere.
// - Sessão no servidor: CacheService.getUserCache() (uma por conta Google
//   que acessa -- o web app roda como USER_ACCESSING), por 6 horas.
// - Grupos: administrador (tudo), diretor (tudo menos as configurações de
//   sistema, como as migrações) e usuario. Os menus do diretor são
//   definidos pelo administrador; os do usuário, pelo administrador ou
//   pelo diretor (só entre os menus que o diretor tem).
// - Primeiro uso: sem nenhum administrador ativo, a tela de login oferece
//   o cadastro do administrador.
// - Esqueci minha senha: código de 6 dígitos por e-mail, válido por 30 min.
// - Não tenho conta: o cadastro entra inativo; administrador ou diretor
//   libera e define o grupo (nunca acima do próprio). Ao liberar, o
//   usuário recebe um e-mail.
// - Compatibilidade: GRUPO vazio = administrador se o e-mail/login estiver
//   na propriedade ADMINS, senão usuario; ATIVO vazio = ativo.
// =====================================================

const GRUPOS_USUARIO = { administrador: 3, diretor: 2, usuario: 1 };
const NOMES_GRUPOS = { administrador: 'Administrador', diretor: 'Diretor', usuario: 'Usuário' };
const SESSAO_SEGUNDOS = 6 * 60 * 60;
const SENHA_RODADAS = 300;
const CODIGO_SENHA_MINUTOS = 30;
const LOGIN_MAX_TENTATIVAS = 5;
const LOGIN_BLOQUEIO_SEGUNDOS = 15 * 60;
const MSG_SENHA_INCORRETA = 'Senha incorreta.';

// Menus do sistema (ids dos itens do MainMenu). fixo: sempre liberado;
// gestao: só administrador e diretor (o diretor sempre tem);
// sistema: só administrador.
const MENUS_SISTEMA = [
  { id: 'nav-dashboard', rotulo: 'Dashboard', secao: '', fixo: true },
  { id: 'nav-chamado-view', rotulo: 'Chamados', secao: '' },
  { id: 'nav-estoque-view', rotulo: 'Saldo de estoque', secao: 'Estoque' },
  { id: 'nav-estoque-movimentos-view', rotulo: 'Movimentações', secao: 'Estoque' },
  { id: 'nav-garantias-view', rotulo: 'Garantias', secao: '' },
  { id: 'nav-notas-view', rotulo: 'Notas fiscais', secao: 'Compras' },
  { id: 'nav-produto-fornecedor-view', rotulo: 'Produtos x fornecedores', secao: 'Compras' },
  { id: 'nav-pedidos-view', rotulo: 'Pedidos', secao: 'Compras' },
  { id: 'nav-agenda', rotulo: 'Agenda', secao: '' },
  { id: 'nav-relatorios-checklist', rotulo: 'Relatório de checklist', secao: 'Relatórios' },
  { id: 'nav-relatorios-manutencao', rotulo: 'Relatório de manutenção', secao: 'Relatórios' },
  { id: 'nav-marcas-view-marcas', rotulo: 'Marcas', secao: 'Cadastros' },
  { id: 'nav-marcas-view-localizacoes', rotulo: 'Localizações', secao: 'Cadastros' },
  { id: 'nav-equipamentos', rotulo: 'Equipamentos', secao: 'Cadastros' },
  { id: 'nav-pecas', rotulo: 'Peças e produtos', secao: 'Cadastros' },
  { id: 'nav-contratos-form', rotulo: 'Contratos', secao: 'Cadastros' },
  { id: 'nav-fornecedores', rotulo: 'Fornecedores', secao: 'Cadastros' },
  { id: 'nav-configuracoes-usuarios', rotulo: 'Usuários', secao: 'Configuração', gestao: true },
  { id: 'nav-configuracoes-permissoes', rotulo: 'Permissões dos grupos', secao: 'Configuração', gestao: true },
  { id: 'nav-configuracoes-modelos-email', rotulo: 'Modelos de e-mail', secao: 'Configuração' },
  { id: 'nav-configuracoes-migracoes', rotulo: 'Migrações da planilha', secao: 'Configuração', sistema: true }
];

// ===================== utilidades =====================

function agoraTextoLogin_() { return Utilities.formatDate(new Date(), 'GMT-3', 'dd/MM/yyyy HH:mm'); }

function hexLogin_(bytes) {
  return bytes.map(function (b) { const v = (b < 0 ? b + 256 : b).toString(16); return v.length === 1 ? '0' + v : v; }).join('');
}

/** Hash da senha: SHA-256 de (sal + senha), repetido SENHA_RODADAS vezes. */
function hashSenha_(senha, sal) {
  let h = String(sal) + '|' + String(senha);
  for (let i = 0; i < SENHA_RODADAS; i++) {
    h = hexLogin_(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, h + '|' + sal, Utilities.Charset.UTF_8));
  }
  return h;
}

function novoSalLogin_() { return Utilities.getUuid().replace(/-/g, ''); }

/** Mínimo 8 caracteres, com letra e número. Devolve a mensagem do problema ou ''. */
function problemaSenha_(senha) {
  const s = String(senha || '');
  if (s.length < 8) return 'A senha precisa ter pelo menos 8 caracteres.';
  if (!/[A-Za-zÀ-ÿ]/.test(s) || !/\d/.test(s)) return 'A senha precisa ter letras e números.';
  return '';
}

function emailValidoLogin_(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e || '').trim()); }

function listaAdminsPropriedade_() {
  return String(PropertiesService.getScriptProperties().getProperty('ADMINS') || '')
    .split(/[,;\s]+/).map(function (s) { return s.trim().toLowerCase(); }).filter(Boolean);
}

/** Grupo da linha do usuário (com a regra de compatibilidade da propriedade ADMINS). */
function grupoUsuarioLinha_(l) {
  const g = String(l[userGrupoCol] || '').trim().toLowerCase();
  if (GRUPOS_USUARIO[g]) return g;
  const admins = listaAdminsPropriedade_();
  const login = String(l[userUsuarioCol] || '').trim().toLowerCase();
  const email = String(l[userEmailCol] || '').trim().toLowerCase();
  const chave = chaveUsuarioLogin_(login);
  const ehAdmin = admins.some(function (a) { return a === login || (email && a === email) || chaveUsuarioLogin_(a) === chave; });
  return ehAdmin ? 'administrador' : 'usuario';
}

function usuarioLinhaAtivo_(l) {
  if (String(l[userDtExclusaoCol] || '').trim()) return false;
  return String(l[userAtivoCol] || 'S').trim().toUpperCase() !== 'N';
}

/** E-mail para onde mandar avisos/códigos: o do cadastro, ou o login se for e-mail. */
function emailUsuarioLinha_(l) {
  const e = String(l[userEmailCol] || '').trim();
  if (emailValidoLogin_(e)) return e;
  const u = String(l[userUsuarioCol] || '').trim();
  return emailValidoLogin_(u) ? u : '';
}

/** Linha (não excluída) do usuário pelo login (com ou sem o domínio do e-mail). { idx, linha } ou null. */
function acharUsuarioPorLogin_(lista, usuario) {
  const u = String(usuario || '').trim().toLowerCase();
  if (!u) return null;
  let idx = lista.findIndex(function (l) { return !String(l[userDtExclusaoCol] || '').trim() && String(l[userUsuarioCol] || '').trim().toLowerCase() === u; });
  if (idx === -1 && u.indexOf('@') === -1) {
    idx = lista.findIndex(function (l) { return !String(l[userDtExclusaoCol] || '').trim() && chaveUsuarioLogin_(l[userUsuarioCol]) === u; });
  }
  if (idx === -1 && u.indexOf('@') !== -1) {
    // login digitado como e-mail: vale o e-mail do cadastro também
    idx = lista.findIndex(function (l) { return !String(l[userDtExclusaoCol] || '').trim() && String(l[userEmailCol] || '').trim().toLowerCase() === u; });
  }
  return idx === -1 ? null : { idx: idx, linha: lista[idx] };
}

function abaUsuarios_() {
  const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(userTableName);
  if (!aba) throw new Error("Aba '" + userTableName + "' não foi encontrada.");
  return aba;
}

function existeAdministradorAtivo_(lista) {
  return (lista || ReadUsers()).some(function (l) {
    return String(l[userIdCol] || '').trim() !== '' && usuarioLinhaAtivo_(l) && grupoUsuarioLinha_(l) === 'administrador';
  });
}

function enviarEmailLogin_(para, assunto, corpo) {
  if (!emailValidoLogin_(para)) return false;
  try {
    MailApp.sendEmail({ to: para, subject: assunto, body: corpo, name: 'Gestão de Equipamentos e Peças' });
    return true;
  } catch (e) {
    console.error('enviarEmailLogin_: ' + e.message);
    return false;
  }
}

function urlSistemaLogin_() {
  try { return ScriptApp.getService().getUrl() || ''; } catch (e) { return ''; }
}

// ===================== sessão =====================

function cacheSessao_() { return CacheService.getUserCache(); }

/**
 * Usuário da sessão, conferido na planilha (desativado ou inativo perde a
 * sessão na hora): { id, usuario, nome, grupo, nivel, email, setor, lotacao } ou null.
 */
function sessaoAtual_() {
  let s = null;
  try { s = JSON.parse(cacheSessao_().get('sessao') || 'null'); } catch (e) { s = null; }
  if (!s || !s.id) return null;
  const l = ReadUsers().find(function (x) { return Number(x[userIdCol]) === Number(s.id); });
  if (!l || !usuarioLinhaAtivo_(l)) { try { cacheSessao_().remove('sessao'); } catch (e) { /* ignora */ } return null; }
  const grupo = grupoUsuarioLinha_(l);
  return {
    id: Number(l[userIdCol]), usuario: String(l[userUsuarioCol] || '').trim(), nome: String(l[userNomeCol] || '').trim() || String(l[userUsuarioCol] || ''),
    grupo: grupo, nivel: GRUPOS_USUARIO[grupo], email: emailUsuarioLinha_(l),
    setor: String(l[userSetorCol] || '').trim(), lotacao: String(l[userLotacao] || '').trim(), telefone: String(l[userTelefoneCol] || '').trim()
  };
}

function nivelUsuarioLogado_() {
  const s = sessaoAtual_();
  return s ? s.nivel : 0;
}

function gravarSessao_(id) {
  cacheSessao_().put('sessao', JSON.stringify({ id: Number(id), criada: Date.now() }), SESSAO_SEGUNDOS);
}

/** Estado para a tela: logado (com grupo e menus liberados) ou não (e se é o primeiro uso). */
function obterSessao() {
  try {
    const s = sessaoAtual_();
    if (!s) return { sucesso: true, logado: false, primeiroUso: !existeAdministradorAtivo_() };
    gravarSessao_(s.id);   // renova as 6 horas
    return { sucesso: true, logado: true, sessao: Object.assign({}, s, { grupoTexto: NOMES_GRUPOS[s.grupo], menus: menusDoGrupo_(s.grupo) }) };
  } catch (e) {
    return { sucesso: false, mensagem: 'Erro no servidor: ' + e.message };
  }
}

function contadorTentativas_(usuario) {
  const cache = CacheService.getScriptCache();
  const chave = 'login:' + String(usuario || '').trim().toLowerCase().slice(0, 200);
  return {
    valor: function () { return Number(cache.get(chave) || 0); },
    somar: function () { cache.put(chave, String(Number(cache.get(chave) || 0) + 1), LOGIN_BLOQUEIO_SEGUNDOS); },
    zerar: function () { cache.remove(chave); }
  };
}

/** Login. Mensagem genérica para usuário inexistente ou senha errada. */
function entrarSistema(usuario, senha) {
  try {
    const u = String(usuario || '').trim();
    if (!u || !String(senha || '')) return { sucesso: false, mensagem: 'Informe o usuário e a senha.' };
    const tent = contadorTentativas_(u);
    if (tent.valor() >= LOGIN_MAX_TENTATIVAS) return { sucesso: false, mensagem: 'Muitas tentativas. Tente de novo em 15 minutos.' };
    const lista = ReadUsers();
    const achado = acharUsuarioPorLogin_(lista, u);
    const l = achado && achado.linha;
    const hash = l ? String(l[userSenhaHashCol] || '') : '';
    const confere = !!hash && hashSenha_(senha, String(l[userSenhaSalCol] || '')) === hash;
    if (!confere) { tent.somar(); return { sucesso: false, mensagem: MSG_SENHA_INCORRETA }; }
    tent.zerar();
    if (!usuarioLinhaAtivo_(l)) return { sucesso: false, mensagem: 'Seu cadastro ainda não foi liberado. Aguarde a liberação por um administrador ou diretor.' };
    executarComLock(function () {
      abaUsuarios_().getRange(achado.idx + firstLineUsers, userUltimoAcessoCol + 1).setValue(agoraTextoLogin_());
    });
    gravarSessao_(l[userIdCol]);
    return obterSessao();
  } catch (e) {
    return { sucesso: false, mensagem: 'Erro no servidor: ' + e.message };
  }
}

function sairSistema() {
  try { cacheSessao_().remove('sessao'); } catch (e) { /* ignora */ }
  return { sucesso: true, mensagem: 'Você saiu do sistema.' };
}

// ===================== cadastro =====================

/** Confere os dados do cadastro pela tela de login. { erro } ou { dados }. */
function validarCadastroLogin_(d0, lista) {
  const d = {
    usuario: String(d0.usuario || '').trim().toLowerCase(), nome: String(d0.nome || '').trim(),
    email: String(d0.email || '').trim().toLowerCase(), matricula: String(d0.matricula || '').trim(),
    lotacao: String(d0.lotacao || '').trim(), setor: String(d0.setor || '').trim(), telefone: String(d0.telefone || '').trim()
  };
  if (!d.usuario) return { erro: 'Informe o usuário.' };
  if (/\s/.test(d.usuario)) return { erro: 'O usuário não pode ter espaços.' };
  // usuário em forma de e-mail: o e-mail é o mesmo
  if (d.usuario.indexOf('@') !== -1) {
    if (!emailValidoLogin_(d.usuario)) return { erro: 'O usuário parece um e-mail, mas não é um e-mail válido.' };
    if (!d.email) d.email = d.usuario;
  }
  if (!d.nome) return { erro: 'Informe o nome.' };
  if (!emailValidoLogin_(d.email)) return { erro: 'Informe um e-mail válido.' };
  const p = problemaSenha_(d0.senha);
  if (p) return { erro: p };
  if (String(d0.senha) !== String(d0.confirmacao === undefined ? d0.senha : d0.confirmacao)) return { erro: 'A confirmação não confere com a senha.' };
  const repetido = (lista || []).some(function (l) {
    return String(l[userIdCol] || '').trim() !== '' && !String(l[userDtExclusaoCol] || '').trim() &&
      (String(l[userUsuarioCol] || '').trim().toLowerCase() === d.usuario || chaveUsuarioLogin_(l[userUsuarioCol]) === chaveUsuarioLogin_(d.usuario));
  });
  if (repetido) return { erro: 'Já existe um cadastro com esse usuário.' };
  return { dados: d };
}

function gravarUsuarioNovo_(d, senha, grupo, ativo) {
  const aba = abaUsuarios_();
  const pos = proximoIdTabela(aba, firstLineUsers);
  const sal = novoSalLogin_();
  const linha = new Array(numColumnsUsers).fill('');
  linha[userIdCol] = pos.novoId; linha[userMatriculaCol] = d.matricula || ''; linha[userUsuarioCol] = d.usuario;
  linha[userNomeCol] = d.nome; linha[userLotacao] = d.lotacao || ''; linha[userSetorCol] = d.setor || '';
  linha[userDtCadastroCol] = Utilities.formatDate(new Date(), 'GMT-3', 'dd/MM/yyyy');
  linha[userEmailCol] = d.email || ''; linha[userTelefoneCol] = d.telefone || '';
  if (senha) { linha[userSenhaHashCol] = hashSenha_(senha, sal); linha[userSenhaSalCol] = sal; }
  linha[userGrupoCol] = grupo; linha[userAtivoCol] = ativo ? 'S' : 'N';
  aba.getRange(pos.proximaLinha, 1, 1, numColumnsUsers).setValues([linha]);
  return pos.novoId;
}

/** Primeiro uso: sem nenhum administrador ativo, cadastra o administrador (já ativo e logado). */
function cadastrarPrimeiroAdministrador(dados) {
  try {
    return executarComLock(function () {
      const lista = ReadUsers();
      if (existeAdministradorAtivo_(lista)) return { sucesso: false, mensagem: 'O sistema já tem administrador. Entre com seu usuário e senha.' };
      const v = validarCadastroLogin_(dados || {}, lista);
      if (v.erro) return { sucesso: false, mensagem: v.erro };
      const id = gravarUsuarioNovo_(v.dados, dados.senha, 'administrador', true);
      gravarSessao_(id);
      return Object.assign(obterSessao(), { mensagem: 'Administrador cadastrado. Bem-vindo(a)!' });
    });
  } catch (e) {
    return { sucesso: false, mensagem: 'Erro no servidor: ' + e.message };
  }
}

/** "Não tenho conta": cadastro inativo (grupo usuário) até a liberação; avisa administradores e diretores. */
function solicitarCadastroUsuario(dados) {
  try {
    const r = executarComLock(function () {
      const lista = ReadUsers();
      const v = validarCadastroLogin_(dados || {}, lista);
      if (v.erro) return { sucesso: false, mensagem: v.erro };
      gravarUsuarioNovo_(v.dados, dados.senha, 'usuario', false);
      return { sucesso: true, dados: v.dados, gestores: lista.filter(function (l) {
        return String(l[userIdCol] || '').trim() !== '' && usuarioLinhaAtivo_(l) && GRUPOS_USUARIO[grupoUsuarioLinha_(l)] >= 2;
      }).map(emailUsuarioLinha_).filter(Boolean) };
    });
    if (!r.sucesso) return r;
    const url = urlSistemaLogin_();
    r.gestores.forEach(function (para) {
      enviarEmailLogin_(para, 'Novo cadastro aguardando liberação: ' + r.dados.nome,
        r.dados.nome + ' (' + r.dados.usuario + ', ' + r.dados.email + ') pediu acesso ao sistema.\n\n' +
        'Para liberar e definir o grupo, acesse Configuração > Usuários' + (url ? ':\n' + url : '.'));
    });
    return { sucesso: true, mensagem: 'Cadastro enviado. Você receberá um e-mail quando um administrador ou diretor liberar o acesso.' };
  } catch (e) {
    return { sucesso: false, mensagem: 'Erro no servidor: ' + e.message };
  }
}

// ===================== esqueci minha senha =====================

const MSG_CODIGO_ENVIADO = 'Se o usuário estiver cadastrado e ativo, enviamos um código para o e-mail do cadastro. Ele vale por ' + CODIGO_SENHA_MINUTOS + ' minutos.';

/** Envia o código de redefinição. Resposta sempre igual (não revela se o usuário existe). */
function enviarCodigoSenha(usuario) {
  try {
    const u = String(usuario || '').trim();
    if (!u) return { sucesso: false, mensagem: 'Informe o usuário.' };
    const envio = executarComLock(function () {
      const lista = ReadUsers();
      const achado = acharUsuarioPorLogin_(lista, u);
      if (!achado || !usuarioLinhaAtivo_(achado.linha)) return null;
      let para = emailUsuarioLinha_(achado.linha);
      // sem e-mail no cadastro: a própria conta Google, se for a dessa pessoa
      if (!para) {
        const google = emailUsuarioLogado_();
        if (google && chaveUsuarioLogin_(google) === chaveUsuarioLogin_(achado.linha[userUsuarioCol])) para = google;
      }
      if (!para) return null;
      const codigo = String(Math.floor(100000 + Math.random() * 900000));
      const sal = String(achado.linha[userSenhaSalCol] || '') || 'codigo';
      abaUsuarios_().getRange(achado.idx + firstLineUsers, userCodigoSenhaCol + 1, 1, 2)
        .setValues([[hashSenha_(codigo, sal + ':codigo'), Date.now() + CODIGO_SENHA_MINUTOS * 60000]]);
      return { para: para, codigo: codigo, nome: String(achado.linha[userNomeCol] || '') };
    });
    if (envio) {
      enviarEmailLogin_(envio.para, 'Código para redefinir a senha',
        'Olá, ' + envio.nome + '.\n\nSeu código para definir uma nova senha no sistema é: ' + envio.codigo +
        '\n\nEle vale por ' + CODIGO_SENHA_MINUTOS + ' minutos. Se não foi você que pediu, ignore este e-mail.');
    }
    return { sucesso: true, mensagem: MSG_CODIGO_ENVIADO };
  } catch (e) {
    return { sucesso: false, mensagem: 'Erro no servidor: ' + e.message };
  }
}

/** Nova senha com o código recebido por e-mail. */
function redefinirSenhaComCodigo(usuario, codigo, novaSenha, confirmacao) {
  try {
    const p = problemaSenha_(novaSenha);
    if (p) return { sucesso: false, mensagem: p };
    if (confirmacao !== undefined && String(confirmacao) !== String(novaSenha)) return { sucesso: false, mensagem: 'A confirmação não confere com a senha.' };
    const invalido = { sucesso: false, mensagem: 'Código inválido ou vencido. Peça um novo código.' };
    const tent = contadorTentativas_('codigo:' + usuario);
    if (tent.valor() >= LOGIN_MAX_TENTATIVAS) return { sucesso: false, mensagem: 'Muitas tentativas. Peça um novo código daqui a 15 minutos.' };
    return executarComLock(function () {
      const lista = ReadUsers();
      const achado = acharUsuarioPorLogin_(lista, usuario);
      if (!achado || !usuarioLinhaAtivo_(achado.linha)) { tent.somar(); return invalido; }
      const l = achado.linha;
      const salAtual = String(l[userSenhaSalCol] || '') || 'codigo';
      const valido = String(l[userCodigoSenhaCol] || '') !== '' && Number(l[userCodigoExpiraCol]) > Date.now() &&
        hashSenha_(String(codigo || '').trim(), salAtual + ':codigo') === String(l[userCodigoSenhaCol]);
      if (!valido) { tent.somar(); return invalido; }
      tent.zerar();
      const sal = novoSalLogin_();
      abaUsuarios_().getRange(achado.idx + firstLineUsers, userSenhaHashCol + 1, 1, 2).setValues([[hashSenha_(novaSenha, sal), sal]]);
      abaUsuarios_().getRange(achado.idx + firstLineUsers, userCodigoSenhaCol + 1, 1, 2).setValues([['', '']]);
      return { sucesso: true, mensagem: 'Senha definida. Entre com seu usuário e a nova senha.' };
    });
  } catch (e) {
    return { sucesso: false, mensagem: 'Erro no servidor: ' + e.message };
  }
}

// ===================== grupos: liberação e nível =====================

/**
 * Administrador ou diretor libera/bloqueia o acesso e define o grupo de
 * um usuário. Nunca acima do próprio nível, nem em quem está acima; não
 * mexe no próprio acesso. dados: { grupo, ativo (true/false) }.
 */
function alterarAcessoUsuario(idInput, dados) {
  try {
    const s = sessaoAtual_();
    if (!s || s.nivel < 2) return { sucesso: false, mensagem: 'Somente administradores e diretores podem liberar usuários.' };
    const r = executarComLock(function () {
      const id = Number(idInput);
      if (id === s.id) return { sucesso: false, mensagem: 'Você não pode alterar o seu próprio acesso.' };
      const lista = ReadUsers();
      const idx = lista.findIndex(function (l) { return Number(l[userIdCol]) === id; });
      if (idx === -1) return { sucesso: false, mensagem: 'Usuário não encontrado.' };
      const l = lista[idx];
      if (String(l[userDtExclusaoCol] || '').trim()) return { sucesso: false, mensagem: 'Usuário desativado: reative antes.' };
      const grupoAtual = grupoUsuarioLinha_(l);
      if (GRUPOS_USUARIO[grupoAtual] > s.nivel) return { sucesso: false, mensagem: 'Você não pode alterar um usuário de nível acima do seu.' };
      const d = dados || {};
      const grupo = d.grupo === undefined || d.grupo === '' ? grupoAtual : String(d.grupo).toLowerCase();
      if (!GRUPOS_USUARIO[grupo]) return { sucesso: false, mensagem: 'Grupo inválido.' };
      if (GRUPOS_USUARIO[grupo] > s.nivel) return { sucesso: false, mensagem: 'Você não pode dar um nível acima do seu (' + NOMES_GRUPOS[s.grupo] + ').' };
      const ativoAntes = usuarioLinhaAtivo_(l);
      const ativo = d.ativo === undefined ? ativoAntes : !!d.ativo;
      abaUsuarios_().getRange(idx + firstLineUsers, userGrupoCol + 1, 1, 2).setValues([[grupo, ativo ? 'S' : 'N']]);
      return { sucesso: true, liberado: ativo && !ativoAntes, linha: l, grupo: grupo, ativo: ativo };
    });
    if (!r.sucesso) return r;
    let mensagem = 'Acesso de ' + String(r.linha[userNomeCol] || '') + ': ' + (r.ativo ? 'ativo' : 'inativo') + ', grupo ' + NOMES_GRUPOS[r.grupo] + '.';
    if (r.liberado) {
      const para = emailUsuarioLinha_(r.linha);
      const semSenha = !String(r.linha[userSenhaHashCol] || '');
      const url = urlSistemaLogin_();
      const ok = enviarEmailLogin_(para, 'Seu acesso ao sistema foi liberado',
        'Olá, ' + String(r.linha[userNomeCol] || '') + '.\n\nSeu cadastro no sistema de Gestão de Equipamentos e Peças foi liberado (grupo ' + NOMES_GRUPOS[r.grupo] + ').\n' +
        'Usuário: ' + String(r.linha[userUsuarioCol] || '') + '\n' +
        (semSenha ? 'Para definir sua senha, use "Esqueci minha senha" na tela de login.\n' : '') +
        (url ? '\nAcesse: ' + url + '\n' : ''));
      mensagem += ok ? ' E-mail de liberação enviado para ' + para + '.' : ' Não foi possível enviar o e-mail de liberação (o cadastro não tem e-mail válido).';
    }
    return { sucesso: true, mensagem: mensagem };
  } catch (e) {
    return { sucesso: false, mensagem: 'Erro no servidor: ' + e.message };
  }
}

// ===================== permissões dos menus =====================

function permissoesSalvas_() {
  try { return JSON.parse(PropertiesService.getScriptProperties().getProperty('PERMISSOES_MENUS') || '{}') || {}; } catch (e) { return {}; }
}

/** Menus liberados para o grupo (ids). Padrão: diretor tudo menos sistema; usuário tudo menos Configuração. */
function menusDoGrupo_(grupo) {
  if (grupo === 'administrador') return MENUS_SISTEMA.map(function (m) { return m.id; });
  const salvas = permissoesSalvas_();
  let lista;
  if (Array.isArray(salvas[grupo])) lista = salvas[grupo];
  else if (grupo === 'diretor') lista = MENUS_SISTEMA.filter(function (m) { return !m.sistema; }).map(function (m) { return m.id; });
  else lista = MENUS_SISTEMA.filter(function (m) { return m.secao !== 'Configuração'; }).map(function (m) { return m.id; });
  // hierarquia: o usuário só tem menus que o diretor também tem
  const doDiretor = grupo === 'usuario' ? menusDoGrupo_('diretor') : null;
  return MENUS_SISTEMA.filter(function (m) {
    if (m.fixo) return true;
    if (m.sistema) return false;
    if (m.gestao) return grupo === 'diretor';
    if (doDiretor && doDiretor.indexOf(m.id) === -1) return false;
    return lista.indexOf(m.id) !== -1;
  }).map(function (m) { return m.id; });
}

/** Para a tela de permissões: o catálogo e o que cada grupo tem, com o que quem está logado pode editar. */
function listarPermissoesMenus() {
  try {
    const s = sessaoAtual_();
    if (!s || s.nivel < 2) return { sucesso: false, mensagem: 'Somente administradores e diretores podem ver as permissões.' };
    const doDiretor = menusDoGrupo_('diretor');
    return {
      sucesso: true, grupo: s.grupo,
      menus: MENUS_SISTEMA.map(function (m) { return { id: m.id, rotulo: m.rotulo, secao: m.secao, fixo: !!m.fixo, gestao: !!m.gestao, sistema: !!m.sistema }; }),
      grupos: {
        diretor: { liberados: menusDoGrupo_('diretor'), editavel: s.nivel >= 3, podeLiberar: MENUS_SISTEMA.filter(function (m) { return !m.fixo && !m.sistema && !m.gestao; }).map(function (m) { return m.id; }) },
        usuario: { liberados: menusDoGrupo_('usuario'), editavel: s.nivel >= 2,
          podeLiberar: MENUS_SISTEMA.filter(function (m) { return !m.fixo && !m.sistema && !m.gestao && doDiretor.indexOf(m.id) !== -1; }).map(function (m) { return m.id; }) }
      }
    };
  } catch (e) {
    return { sucesso: false, mensagem: 'Erro no servidor: ' + e.message };
  }
}

/** Grava os menus de um grupo: o diretor só pelo administrador; o usuário pelo administrador ou diretor (só entre os menus do diretor). */
function salvarPermissoesMenus(grupo, ids) {
  try {
    const s = sessaoAtual_();
    if (!s || s.nivel < 2) return { sucesso: false, mensagem: 'Somente administradores e diretores podem alterar as permissões.' };
    if (grupo !== 'diretor' && grupo !== 'usuario') return { sucesso: false, mensagem: 'Grupo inválido.' };
    if (grupo === 'diretor' && s.nivel < 3) return { sucesso: false, mensagem: 'Somente o administrador define os menus do diretor.' };
    const pedidos = Array.isArray(ids) ? ids.map(String) : [];
    const doDiretor = menusDoGrupo_('diretor');
    const validos = MENUS_SISTEMA.filter(function (m) { return !m.fixo && !m.sistema && !m.gestao; }).map(function (m) { return m.id; });
    const negados = pedidos.filter(function (id) { return validos.indexOf(id) === -1 || (grupo === 'usuario' && doDiretor.indexOf(id) === -1); });
    if (negados.length) return { sucesso: false, mensagem: 'Há menus que você não pode liberar para este grupo.' };
    return executarComLock(function () {
      const salvas = permissoesSalvas_();
      salvas[grupo] = pedidos;
      // o usuário nunca fica com menu que o diretor não tem
      if (grupo === 'diretor' && Array.isArray(salvas.usuario)) salvas.usuario = salvas.usuario.filter(function (id) { return pedidos.indexOf(id) !== -1; });
      PropertiesService.getScriptProperties().setProperty('PERMISSOES_MENUS', JSON.stringify(salvas));
      return { sucesso: true, mensagem: 'Permissões do grupo ' + NOMES_GRUPOS[grupo] + ' salvas.' };
    });
  } catch (e) {
    return { sucesso: false, mensagem: 'Erro no servidor: ' + e.message };
  }
}
