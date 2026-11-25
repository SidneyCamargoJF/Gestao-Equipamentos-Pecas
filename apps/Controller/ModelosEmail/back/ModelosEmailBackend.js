// =====================================================
// MODELOS DE E-MAIL + ENVIO DE E-MAIL DO CHAMADO
// Modelos: Configuração > Modelos de e-mail (tbl_modelos_email). Assunto e
// corpo aceitam {{campo}}; os campos vêm de camposModeloEmail_ e são
// preenchidos com os dados do chamado (prepararEmailChamado). O envio sai
// pela conta de quem está usando o sistema (web app USER_ACCESSING) e fica
// registrado no histórico do chamado.
// =====================================================

// Campos disponíveis nos modelos: { chave, rotulo }. A chave é o que vai
// entre {{ }}; o valor sai de valoresCamposEmailChamado_.
function camposModeloEmail_() {
  return [
    { chave: 'numero_chamado', rotulo: 'Nº do chamado' },
    { chave: 'assunto', rotulo: 'Assunto do chamado' },
    { chave: 'tipo', rotulo: 'Tipo de manutenção' },
    { chave: 'prioridade', rotulo: 'Prioridade' },
    { chave: 'status', rotulo: 'Status' },
    { chave: 'descricao', rotulo: 'Descrição' },
    { chave: 'equipamentos', rotulo: 'Equipamentos' },
    { chave: 'data_abertura', rotulo: 'Data de abertura' },
    { chave: 'aberto_por', rotulo: 'Aberto por' },
    { chave: 'atribuido_a', rotulo: 'Atribuído a' },
    { chave: 'contrato', rotulo: 'Nº do contrato' },
    { chave: 'empresa', rotulo: 'Empresa' },
    { chave: 'competencia', rotulo: 'Competência' },
    { chave: 'data_prevista', rotulo: 'Data prevista' },
    { chave: 'prazo_atendimento', rotulo: 'Prazo de atendimento' },
    { chave: 'prazo_solucao', rotulo: 'Prazo de solução' },
    { chave: 'usuario', rotulo: 'Seu nome' },
    { chave: 'data_hoje', rotulo: 'Data de hoje' }
  ];
}

// Modelos gravados na primeira vez que a aba é criada (os mesmos assuntos
// que a tela de detalhes do chamado oferecia antes, agora editáveis).
function modelosEmailIniciais_() {
  const rodape = '\n\nAtenciosamente,\n{{usuario}}';
  return [
    {
      nome: 'Solicitação de atendimento',
      assunto: 'Chamado #{{numero_chamado}} — Solicitação de atendimento (Contrato {{contrato}})',
      corpo: 'Prezados,\n\nSolicitamos atendimento referente ao chamado #{{numero_chamado}}, aberto em {{data_abertura}}.\n\n' +
        'Assunto: {{assunto}}\nEquipamento: {{equipamentos}}\nContrato: {{contrato}} — {{empresa}}\n' +
        'Prazo de atendimento: {{prazo_atendimento}}\n\nFicamos no aguardo do retorno.' + rodape
    },
    {
      nome: 'Cobrança de prazo de atendimento',
      assunto: 'Chamado #{{numero_chamado}} — Cobrança de prazo de atendimento (Contrato {{contrato}})',
      corpo: 'Prezados,\n\nO chamado #{{numero_chamado}} ({{assunto}}), vinculado ao contrato {{contrato}} — {{empresa}}, ' +
        'tem prazo de atendimento até {{prazo_atendimento}} e ainda não identificamos retorno.\n\n' +
        'Solicitamos posicionamento com urgência.' + rodape
    },
    {
      nome: 'Cobrança de prazo de solução',
      assunto: 'Chamado #{{numero_chamado}} — Cobrança de prazo de solução (Contrato {{contrato}})',
      corpo: 'Prezados,\n\nO chamado #{{numero_chamado}} ({{assunto}}), vinculado ao contrato {{contrato}} — {{empresa}}, ' +
        'tem prazo de solução até {{prazo_solucao}} e o atendimento ainda não foi concluído.\n\n' +
        'Solicitamos posicionamento sobre a solução definitiva.' + rodape
    },
    {
      nome: 'Agendamento da execução do serviço',
      assunto: 'Chamado #{{numero_chamado}} — Agendamento da execução do serviço (Contrato {{contrato}})',
      corpo: 'Prezados,\n\nGostaríamos de agendar a execução do serviço referente ao chamado #{{numero_chamado}} ({{assunto}}), ' +
        'equipamento {{equipamentos}}.\nData prevista: {{data_prevista}}\n\nPor favor, indiquem data e horário disponíveis.' + rodape
    },
    {
      nome: 'Solicitação de atualização',
      assunto: 'Chamado #{{numero_chamado}} — Solicitação de atualização',
      corpo: 'Prezados,\n\nSolicitamos uma atualização sobre o andamento do chamado #{{numero_chamado}} ({{assunto}}), ' +
        'vinculado ao contrato {{contrato}} — {{empresa}}.' + rodape
    }
  ];
}

/** Cria a aba de modelos (com os modelos iniciais) se ainda não existir. */
function garantirAbaModelosEmail_() {
  const r = criarAbaSeNaoExistir_(modelosEmailTableName, CABECALHO_MODELOS_EMAIL);
  if (!r.criada) return r;
  const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(modelosEmailTableName);
  const hoje = Utilities.formatDate(new Date(), 'GMT-3', 'dd/MM/yyyy');
  const linhas = modelosEmailIniciais_().map(function (m, i) {
    return [i + 1, m.nome, m.assunto, m.corpo, hoje, '', ''];
  });
  aba.getRange(firstLineModelosEmail, 1, linhas.length, numColumnsModelosEmail).setValues(linhas);
  return r;
}

function modelosEmailAtivos_() {
  return ReadModelosEmail()
    .filter(function (l) { return String(l[modeloEmailIdCol] || '').trim() !== '' && !String(l[modeloEmailDtExclusaoCol] || '').trim(); })
    .map(function (l) {
      return {
        id: Number(l[modeloEmailIdCol]),
        nome: String(l[modeloEmailNomeCol] || '').trim(),
        assunto: String(l[modeloEmailAssuntoCol] || ''),
        corpo: String(l[modeloEmailCorpoCol] || '')
      };
    })
    .sort(function (a, b) { return a.nome.localeCompare(b.nome, 'pt-BR'); });
}

/** { sucesso, modelos: [{ id, nome, assunto, corpo }], campos: [{ chave, rotulo }] } */
function listarModelosEmail() {
  try {
    if (!SpreadsheetApp.getActiveSpreadsheet().getSheetByName(modelosEmailTableName)) {
      executarComLock(garantirAbaModelosEmail_);
    }
    return { sucesso: true, modelos: modelosEmailAtivos_(), campos: camposModeloEmail_() };
  } catch (e) {
    return { sucesso: false, mensagem: 'Erro no servidor: ' + e.message, modelos: [], campos: camposModeloEmail_() };
  }
}

/** Inclui (sem id) ou altera (com id) um modelo. dados: { id, nome, assunto, corpo } */
function salvarModeloEmail(dados) {
  try {
    return executarComLock(function () { return salvarModeloEmail_(dados); });
  } catch (e) {
    return { sucesso: false, mensagem: 'Erro no servidor: ' + e.message };
  }
}

function salvarModeloEmail_(dados) {
  const id = Number(dados && dados.id) || 0;
  const nome = String((dados && dados.nome) || '').trim();
  const assunto = String((dados && dados.assunto) || '').trim();
  const corpo = String((dados && dados.corpo) || '').replace(/\r\n/g, '\n').replace(/\s+$/, '');

  if (!nome) return { sucesso: false, mensagem: 'Digite o nome do modelo.' };
  if (!assunto) return { sucesso: false, mensagem: 'Digite o assunto do e-mail.' };
  if (!corpo.trim()) return { sucesso: false, mensagem: 'Digite o texto do e-mail.' };

  garantirAbaModelosEmail_();
  const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(modelosEmailTableName);
  const linhas = ReadModelosEmail();

  const repetido = linhas.some(function (l) {
    return !String(l[modeloEmailDtExclusaoCol] || '').trim() && Number(l[modeloEmailIdCol]) !== id &&
      String(l[modeloEmailNomeCol] || '').trim().toLowerCase() === nome.toLowerCase();
  });
  if (repetido) return { sucesso: false, mensagem: 'Já existe um modelo com o nome "' + nome + '".' };

  const hoje = Utilities.formatDate(new Date(), 'GMT-3', 'dd/MM/yyyy');

  if (id) {
    const idx = linhas.findIndex(function (l) { return Number(l[modeloEmailIdCol]) === id; });
    if (idx === -1 || String(linhas[idx][modeloEmailDtExclusaoCol] || '').trim()) {
      return { sucesso: false, mensagem: 'Modelo não encontrado.' };
    }
    const linha = idx + firstLineModelosEmail;
    aba.getRange(linha, modeloEmailNomeCol + 1, 1, 3).setValues([[nome, assunto, corpo]]);
    aba.getRange(linha, modeloEmailDtAlteracaoCol + 1).setValue(hoje);
    return { sucesso: true, mensagem: 'Modelo alterado com sucesso!', id: id };
  }

  const pos = proximoIdTabela(aba, firstLineModelosEmail);
  aba.getRange(pos.proximaLinha, 1, 1, numColumnsModelosEmail).setValues([[pos.novoId, nome, assunto, corpo, hoje, '', '']]);
  return { sucesso: true, mensagem: 'Modelo salvo com sucesso!', id: pos.novoId };
}

/** Exclusão lógica (preenche DATA_EXCLUSAO). */
function excluirModeloEmail(idInput) {
  try {
    return executarComLock(function () {
      const id = Number(idInput);
      if (!id) return { sucesso: false, mensagem: 'ID do modelo inválido.' };
      const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(modelosEmailTableName);
      if (!aba) return { sucesso: false, mensagem: 'Modelo não encontrado.' };
      const idx = ReadModelosEmail().findIndex(function (l) { return Number(l[modeloEmailIdCol]) === id; });
      if (idx === -1) return { sucesso: false, mensagem: 'Modelo não encontrado.' };
      const hoje = Utilities.formatDate(new Date(), 'GMT-3', 'dd/MM/yyyy');
      aba.getRange(idx + firstLineModelosEmail, modeloEmailDtExclusaoCol + 1).setValue(hoje);
      return { sucesso: true, mensagem: 'Modelo excluído com sucesso!' };
    });
  } catch (e) {
    return { sucesso: false, mensagem: 'Erro no servidor: ' + e.message };
  }
}

// ===== E-MAIL DO CHAMADO =====

function valoresCamposEmailChamado_(c) {
  const texto = function (v) { return String(v === undefined || v === null ? '' : v).trim(); };
  return {
    numero_chamado: texto(c.id),
    assunto: texto(c.motivo),
    tipo: texto(c.tipo),
    prioridade: texto(c.prioridade),
    status: texto(c.status) === 'Concluido' ? 'Concluído' : texto(c.status),
    descricao: texto(c.observacao),
    equipamentos: texto(c.equipamento),
    data_abertura: texto(c.dataAbertura),
    aberto_por: texto(c.abertoPor),
    atribuido_a: texto(c.atribuidoA),
    contrato: texto(c.contratoNumero),
    empresa: texto(c.contratoEmpresa),
    competencia: texto(c.competencia),
    data_prevista: texto(c.dataPrevista),
    prazo_atendimento: texto(c.prazoAtendimento),
    prazo_solucao: texto(c.prazoSolucao),
    usuario: nomeUsuarioLogado(),
    data_hoje: Utilities.formatDate(new Date(), 'GMT-3', 'dd/MM/yyyy')
  };
}

/**
 * Tudo que a tela de envio precisa: destinatário sugerido (e-mail do
 * contrato ou do fornecedor), valores dos campos, modelos e campos.
 */
function prepararEmailChamado(chamadoId) {
  try {
    const det = buscarChamadoDetalhado(chamadoId);
    if (!det || !det.sucesso) return { sucesso: false, mensagem: (det && det.mensagem) || 'Chamado não encontrado.' };
    const c = det.chamado;
    const lista = listarModelosEmail();
    return {
      sucesso: true,
      chamadoId: c.id,
      para: String(c.contratoEmail || '').trim(),
      empresa: String(c.contratoEmpresa || '').trim(),
      valores: valoresCamposEmailChamado_(c),
      modelos: lista.modelos || [],
      campos: lista.campos || camposModeloEmail_()
    };
  } catch (e) {
    return { sucesso: false, mensagem: 'Erro no servidor: ' + e.message };
  }
}

// "a@x.com; b@y.com" -> ['a@x.com', 'b@y.com'] (null se algum for inválido)
function listaEmails_(texto) {
  const itens = String(texto || '').split(/[;,\s]+/).map(function (s) { return s.trim(); }).filter(Boolean);
  const valido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const invalidos = itens.filter(function (s) { return !valido.test(s); });
  return { itens: itens, invalidos: invalidos };
}

/** dados: { chamadoId, para, cc, assunto, corpo } */
function enviarEmailChamado(dados) {
  try {
    const chamadoId = Number(dados && dados.chamadoId);
    if (!chamadoId) return { sucesso: false, mensagem: 'Chamado inválido.' };
    if (!ReadTickets().some(function (l) { return Number(l[0]) === chamadoId; })) {
      return { sucesso: false, mensagem: 'Chamado não encontrado (ID ' + chamadoId + ').' };
    }

    const para = listaEmails_(dados.para);
    const cc = listaEmails_(dados.cc);
    if (!para.itens.length) return { sucesso: false, mensagem: 'Informe o e-mail do destinatário.' };
    const invalidos = para.invalidos.concat(cc.invalidos);
    if (invalidos.length) return { sucesso: false, mensagem: 'E-mail inválido: ' + invalidos.join(', ') };

    const assunto = String(dados.assunto || '').trim();
    const corpo = String(dados.corpo || '').replace(/\r\n/g, '\n');
    if (!assunto) return { sucesso: false, mensagem: 'Digite o assunto do e-mail.' };
    if (!corpo.trim()) return { sucesso: false, mensagem: 'Digite o texto do e-mail.' };
    if (/\{\{\s*\w+\s*\}\}/.test(assunto + corpo)) {
      return { sucesso: false, mensagem: 'O e-mail ainda tem campos do modelo sem preencher ({{...}}). Revise o texto antes de enviar.' };
    }

    if (MailApp.getRemainingDailyQuota() < para.itens.length + cc.itens.length) {
      return { sucesso: false, mensagem: 'A cota diária de envio de e-mails da sua conta acabou. Tente amanhã.' };
    }

    const opcoes = { to: para.itens.join(','), subject: assunto, body: corpo };
    if (cc.itens.length) opcoes.cc = cc.itens.join(',');
    MailApp.sendEmail(opcoes);

    adicionarHistoricoSistema(chamadoId, 'E-mail enviado para ' + para.itens.join(', ') +
      (cc.itens.length ? ' (cópia: ' + cc.itens.join(', ') + ')' : '') + '. Assunto: ' + assunto);

    return { sucesso: true, mensagem: 'E-mail enviado para ' + para.itens.join(', ') + '.' };
  } catch (e) {
    return { sucesso: false, mensagem: 'Erro ao enviar o e-mail: ' + e.message };
  }
}
