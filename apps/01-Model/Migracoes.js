// =====================================================
// MIGRAÇÕES DA PLANILHA
//
// Como usar (editor do Apps Script: escolher a função e clicar em Executar):
//   executarMigracoes()        -> cria/completa a estrutura de TODAS as abas e
//                                 roda as migrações de dados ainda não feitas.
//   verificarEstruturaTabelas() -> só confere (não muda nada) e mostra no log
//                                 o que falta em cada aba.
//   listarMigracoes()          -> quais migrações de dados já rodaram e quando.
//
// 1) ESTRUTURA (roda sempre, é segura de repetir) -- uma migração por aba,
//    gerada de ESQUEMA_TABELAS:
//    - aba que não existe: é criada com o cabeçalho na linha 2 (dados a
//      partir da linha 3), igual ao resto da planilha;
//    - aba que existe: só preenche os nomes de cabeçalho que estão VAZIOS
//      na linha 2 (colunas novas no fim da aba). Nunca renomeia, reordena,
//      apaga coluna ou mexe nos dados. Nome diferente do esperado só aparece
//      como aviso no relatório.
// 2) DADOS (rodam uma vez cada; o registro fica nas Propriedades do script,
//    chave MIGRACOES_APLICADAS): ver MIGRACOES_DADOS.
//
// Regra para colunas novas: acrescente o nome no FIM da lista da aba em
// ESQUEMA_TABELAS (e no model, numColumns + constante). Tabela nova: inclua
// a entrada aqui. Migração de dados nova: inclua em MIGRACOES_DADOS com um
// id novo (nunca reaproveite um id).
// =====================================================

const LINHA_CABECALHO_PADRAO = 2;
const PROPRIEDADE_MIGRACOES = 'MIGRACOES_APLICADAS';

// Esquema de todas as abas usadas pelo sistema, na ordem real das colunas.
function esquemaTabelas_() {
  return [
    // ----- chamados
    { aba: ticketsTableName, colunas: ['ID', 'EQUIPAMENTO_ID', 'MOTIVO', 'TIPO', 'PRIORIDADE', 'DATA_ABERTURA', 'ABERTO_POR',
      'ATRIBUIDO_A', 'DATA_INICIO_ANDAMENTO', 'DATA_FINALIZACAO', 'OBSERVACAO', 'STATUS', 'DATA_ALTERACAO', 'CONTRATO_ID', 'ORIGEM',
      'COMPETENCIA', 'DATA_PREVISTA', 'PRAZO_ATENDIMENTO', 'PRAZO_SOLUCAO', 'FORNECEDOR_ID', 'DATA_EXCLUSAO'] },
    { aba: ticketEquipTableName, colunas: ['ID', 'CHAMADO_ID', 'EQUIPAMENTO_ID', 'DATA_CADASTRO', 'DATA_EXCLUSAO', 'OBSERVACAO_ENCERRAMENTO'] },
    { aba: ticketHistoricoTableName, colunas: ['ID', 'CHAMADO_ID', 'TEXTO', 'DATA', 'DATA_ALTERACAO'] },
    { aba: ticketAnexosTableName, colunas: ['ID', 'CHAMADO_ID', 'TIPO', 'NOME_ARQUIVO', 'URL', 'HASH', 'DATA_UPLOAD', 'DATA_EXCLUSAO'] },
    { aba: ticketChecklistTableName, colunas: ['ID', 'CHAMADO_ID', 'EQUIPAMENTO_ID', 'CHECKLIST_ID', 'DESCRICAO', 'PERIODICIDADE',
      'RESULTADO', 'OBSERVACAO', 'EXECUTADO_EM', 'REGISTRADO_POR', 'DATA_CADASTRO', 'DATA_ALTERACAO', 'DATA_EXCLUSAO'] },
    { aba: ticketEmailsTableName, colunas: CABECALHO_CHAMADO_EMAILS },
    // ----- contratos
    { aba: contractTableName, colunas: ['ID', 'NUMERO', 'NOME', 'DATA_ENCERRAMENTO', 'SEI', 'DATA_FECHAMENTO', 'EMPRESA', 'OBJETO',
      'OBSERVACOES', 'VALOR', 'DATA_INICIAL', 'DATA_FINAL', 'CONTATO_EMPRESA', 'TELEFONE', 'EMAIL', 'GESTOR', 'ATIVO', 'SITUACAO',
      'DATA_ALTERACAO', 'DATA_EXCLUSAO', 'DATA_BASE_PREVENTIVA'] },
    { aba: contractsEquipamentsTableName, colunas: ['ID', 'CONTRATO_ID', 'EQUIPAMENTO_ID', 'DATA_CADASTRO', 'DATA_EXCLUSAO'] },
    { aba: contractsServicosTableName, colunas: ['ID', 'CONTRATO_ID', 'TIPO_MANUTENCAO', 'CATEGORIA', 'TIPO', 'CAPACIDADE', 'PERIODICIDADE',
      'DATA_CADASTRO', 'DATA_EXCLUSAO', 'DATA_ALTERACAO', 'VALOR_UNITARIO'] },
    { aba: contractsProdutosTableName, colunas: ['ID', 'CONTRATO_ID', 'NOME', 'DATA_CADASTRO', 'DATA_EXCLUSAO'] },
    { aba: contractsChecklistTableName, colunas: ['ID', 'CONTRATO_ID', 'DESCRICAO', 'DATA_CADASTRO', 'DATA_EXCLUSAO', 'DATA_ALTERACAO',
      'PERIODICIDADE', 'SERVICO_ID', 'CATEGORIA', 'TIPO'] },
    { aba: contractsSlaTableName, colunas: ['ID', 'CONTRATO_ID', 'PRIORIDADE', 'PRAZO_ATENDIMENTO_HORAS', 'PRAZO_SOLUCAO_HORAS',
      'HORAS_UTEIS', 'DATA_CADASTRO', 'DATA_ALTERACAO', 'DATA_EXCLUSAO'] },
    { aba: contractsAnexosTableName, colunas: ['ID', 'CONTRATO_ID', 'TIPO', 'NOME_ARQUIVO', 'URL', 'HASH', 'DATA_UPLOAD', 'DATA_EXCLUSAO'] },
    // ----- equipamentos (a leitura usa o nome do cabeçalho: ESTADO precisa ser exatamente este)
    { aba: 'tbl_equipamentos', colunas: ['ID', 'NOME', 'MARCA', 'CAPACIDADE', 'MODELO', 'PATRIMONIO', 'SEQUENCIA', 'LOCALIZACAO',
      'FORNECEDOR', 'DATA_ENTRADA', 'NOTA_FISCAL', 'SEI', 'DATA_GARANTIA', 'VALOR_AQUISICAO', 'OBSERVACOES', 'ACTIVE',
      'DT_CADASTRO', 'DT_ALTERACAO', 'DT_EXCLUSAO', 'ESTADO', 'PATRIMONIO_ANTERIOR'] },
    // ----- peças e produtos, aquisições, garantias
    { aba: PartsTableName, colunas: ['ID', 'NOME', 'MARCA', 'MODELO', 'CAPACIDADE', 'NUMERO_SERIE', 'LOCAL', 'FORNECEDOR', 'NUMERO_NF',
      'DATA_NF', 'GARANTIA', 'DATA_GARANTIA', 'MODALIDADE', 'VALOR', 'SEI', 'DATA_CADASTRO', 'DATA_ALTERACAO', 'DATA_EXCLUSAO', 'TIPO'] },
    { aba: pecasAquisicoesTableName, colunas: CABECALHO_PECAS_AQUISICOES },
    { aba: garantiasTableName, colunas: CABECALHO_GARANTIAS },
    { aba: garantiaHistTableName, colunas: CABECALHO_GARANTIA_HIST },
    { aba: garantiaAnexosTableName, colunas: CABECALHO_GARANTIA_ANEXOS },
    // ----- compras e estoque
    { aba: notasFiscaisTableName, colunas: CABECALHO_NOTAS_FISCAIS },
    { aba: nfItensTableName, colunas: CABECALHO_NF_ITENS },
    { aba: nfAnexosTableName, colunas: CABECALHO_NF_ANEXOS },
    { aba: produtoFornecedorTableName, colunas: CABECALHO_PRODUTO_FORNECEDOR },
    { aba: estoqueMovTableName, colunas: CABECALHO_ESTOQUE_MOV },
    { aba: estoqueParamTableName, colunas: CABECALHO_ESTOQUE_PARAM },
    // ----- cadastros de apoio e configuração
    { aba: supplierTableName, colunas: ['ID', 'PRESTADOR_SERVICO', 'DISTRIBUIDOR_PRODUTOS', 'RAZAO_SOCIAL', 'NOME_FANTASIA', 'CNPJ',
      'INSCRICAO_ESTADUAL', 'INSCRICAO_MUNICIPAL', 'EMAIL', 'TELEFONE', 'CELULAR', 'WHATSAPP', 'CEP', 'LOGRADOURO', 'NUMERO', 'BAIRRO',
      'CIDADE', 'ESTADO', 'COMPLEMENTO', 'DATA_CADASTRO', 'DATA_ALTERACAO', 'STATUS'] },
    { aba: brandTableName, colunas: ['ID', 'NOME', 'DATA_CADASTRO', 'DATA_EXCLUSAO', 'DATA_ALTERACAO'] },
    { aba: LocalTableName, colunas: ['ID', 'NOME', 'OBSERVACAO', 'DATA_CADASTRO', 'DATA_EXCLUSAO', 'DATA_ALTERACAO'] },
    { aba: employeeTableName, colunas: ['ID', 'NOME'] },
    { aba: userTableName, colunas: ['ID', 'MATRICULA', 'USUARIO', 'NOME', 'LOTACAO', 'SETOR', 'DATA_CADASTRO', 'DATA_EXCLUSAO',
      'EMAIL', 'TELEFONE_RAMAL'] },
    // modelos de e-mail: criada por garantirAbaModelosEmail_ (vem com os modelos iniciais)
    { aba: modelosEmailTableName, colunas: CABECALHO_MODELOS_EMAIL, criar: garantirAbaModelosEmail_ }
  ];
}

// Migrações de dados: rodam UMA vez cada (id nunca muda nem se repete).
function migracoesDados_() {
  return [
    { id: '2026-01-periodicidade-checklist', descricao: 'Grava a PERIODICIDADE dos itens antigos do checklist do contrato (prefixo [Mensal] etc.)',
      executar: function () { return { sucesso: true, mensagem: migrarPeriodicidadeChecklist() + ' item(ns) atualizado(s)' }; } },
    { id: '2026-01-campos-novos-chamados', descricao: 'Preenche ORIGEM, contrato, fornecedor e prazos de SLA dos chamados antigos',
      executar: function () { return preencherCamposNovosChamados(); } },
    { id: '2026-11-modelos-email-contexto', descricao: 'Coluna CONTEXTO e modelos iniciais de garantia em tbl_modelos_email',
      executar: function () { return garantirAbaModelosEmail_(); } },
    { id: '2026-11-estoque-entradas-notas', descricao: 'Entradas de estoque das notas fiscais lançadas antes do estoque',
      executar: function () { return sincronizarEntradasTodasNotas(); } }
  ];
}

// Linha do cabeçalho de uma aba existente: a 2 (padrão); se ela estiver
// vazia e a 1 tiver nomes, a 1 (abas antigas).
function linhaCabecalhoAba_(aba, numCol) {
  const larg = Math.max(numCol, aba.getLastColumn(), 1);
  const temTexto = function (linha) {
    return aba.getRange(linha, 1, 1, larg).getValues()[0].some(function (v) { return String(v || '').trim() !== '' && isNaN(Number(v)); });
  };
  if (temTexto(LINHA_CABECALHO_PADRAO)) return LINHA_CABECALHO_PADRAO;
  if (temTexto(1)) return 1;
  return LINHA_CABECALHO_PADRAO;
}

/**
 * Confere (e, com aplicar=true, cria/completa) a estrutura de uma aba.
 * Devolve { aba, situacao: 'ok'|'criada'|'faltando'|'completada'|'ausente',
 * colunasIncluidas: [], avisos: [] }
 */
function migrarEstruturaAba_(def, aplicar) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let aba = ss.getSheetByName(def.aba);
  const r = { aba: def.aba, situacao: 'ok', colunasIncluidas: [], avisos: [] };
  if (!aba) {
    if (!aplicar) { r.situacao = 'ausente'; return r; }
    if (def.criar) def.criar();
    else criarAbaSeNaoExistir_(def.aba, def.colunas);
    r.situacao = 'criada';
    return r;
  }
  const linhaCab = linhaCabecalhoAba_(aba, def.colunas.length);
  const atuais = aba.getRange(linhaCab, 1, 1, def.colunas.length).getValues()[0];
  def.colunas.forEach(function (nome, i) {
    const atual = String(atuais[i] === undefined || atuais[i] === null ? '' : atuais[i]).trim();
    if (atual === '') {
      r.colunasIncluidas.push(columnLetraMigracao_(i + 1) + ' ' + nome);
      if (aplicar) aba.getRange(linhaCab, i + 1).setValue(nome);
    } else if (atual.toUpperCase() !== nome.toUpperCase()) {
      r.avisos.push('coluna ' + columnLetraMigracao_(i + 1) + ': cabeçalho "' + atual + '" (esperado ' + nome + ')');
    }
  });
  if (r.colunasIncluidas.length) r.situacao = aplicar ? 'completada' : 'faltando';
  return r;
}

function columnLetraMigracao_(n) {
  let s = '';
  while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); }
  return s;
}

function aplicadasMigracoes_() {
  try { return JSON.parse(PropertiesService.getScriptProperties().getProperty(PROPRIEDADE_MIGRACOES) || '{}') || {}; }
  catch (e) { return {}; }
}

function relatorioTexto_(rel) {
  const linhas = ['== Estrutura das abas =='];
  rel.estrutura.forEach(function (e) {
    linhas.push(e.aba + ': ' + e.situacao + (e.colunasIncluidas.length ? ' — colunas: ' + e.colunasIncluidas.join(', ') : '') +
      (e.avisos.length ? ' — AVISOS: ' + e.avisos.join('; ') : ''));
  });
  if (rel.dados) {
    linhas.push('== Migrações de dados ==');
    rel.dados.forEach(function (d) { linhas.push(d.id + ': ' + d.situacao + (d.mensagem ? ' — ' + d.mensagem : '')); });
  }
  return linhas.join('\n');
}

/** Só confere a estrutura; não muda nada. */
function verificarEstruturaTabelas() {
  const rel = { estrutura: esquemaTabelas_().map(function (def) { return migrarEstruturaAba_(def, false); }) };
  rel.pendencias = rel.estrutura.filter(function (e) { return e.situacao !== 'ok' || e.avisos.length; }).length;
  rel.texto = relatorioTexto_(rel);
  Logger.log(rel.texto);
  return rel;
}

/**
 * Cria/completa a estrutura de todas as abas e roda as migrações de dados
 * pendentes. Pode ser executada de novo a qualquer momento.
 */
function executarMigracoes() {
  return executarComLock(function () {
    const rel = { estrutura: esquemaTabelas_().map(function (def) { return migrarEstruturaAba_(def, true); }), dados: [] };
    const aplicadas = aplicadasMigracoes_();
    migracoesDados_().forEach(function (m) {
      if (aplicadas[m.id]) { rel.dados.push({ id: m.id, situacao: 'já aplicada em ' + aplicadas[m.id] }); return; }
      try {
        const res = m.executar();
        if (res && res.sucesso === false) { rel.dados.push({ id: m.id, situacao: 'ERRO', mensagem: res.mensagem }); return; }
        aplicadas[m.id] = Utilities.formatDate(new Date(), 'GMT-3', 'dd/MM/yyyy HH:mm');
        rel.dados.push({ id: m.id, situacao: 'aplicada agora', mensagem: (res && (res.mensagem || (Array.isArray(res) ? res.length + ' item(ns)' : ''))) || '' });
      } catch (e) {
        rel.dados.push({ id: m.id, situacao: 'ERRO', mensagem: e.message });
      }
    });
    PropertiesService.getScriptProperties().setProperty(PROPRIEDADE_MIGRACOES, JSON.stringify(aplicadas));
    rel.sucesso = !rel.dados.some(function (d) { return d.situacao === 'ERRO'; });
    rel.texto = relatorioTexto_(rel);
    Logger.log(rel.texto);
    return rel;
  });
}

/** Situação das migrações de dados. */
function listarMigracoes() {
  const aplicadas = aplicadasMigracoes_();
  const lista = migracoesDados_().map(function (m) {
    return { id: m.id, descricao: m.descricao, aplicadaEm: aplicadas[m.id] || '' };
  });
  Logger.log(lista.map(function (m) { return m.id + ': ' + (m.aplicadaEm || 'pendente') + ' — ' + m.descricao; }).join('\n'));
  return lista;
}

// ===== TELA: Configuração > Migrações da planilha =====

/** Situação atual: estrutura de cada aba + migrações de dados (só leitura). */
function painelMigracoes() {
  try {
    const v = verificarEstruturaTabelas();
    return {
      sucesso: true,
      admin: usuarioEhAdmin(),
      estrutura: v.estrutura,
      pendencias: v.pendencias,
      migracoes: listarMigracoes()
    };
  } catch (e) {
    return { sucesso: false, mensagem: 'Erro no servidor: ' + e.message };
  }
}

/** Botão "Executar migrações" (só administradores, propriedade ADMINS). */
function executarMigracoesPeloSistema() {
  try {
    if (!usuarioEhAdmin()) return { sucesso: false, mensagem: 'Somente administradores podem executar as migrações.' };
    const r = executarMigracoes();
    return {
      sucesso: r.sucesso, estrutura: r.estrutura, dados: r.dados, texto: r.texto,
      mensagem: r.sucesso ? 'Migrações executadas.' : 'Migrações executadas com erro (veja o relatório).'
    };
  } catch (e) {
    return { sucesso: false, mensagem: 'Erro no servidor: ' + e.message };
  }
}
