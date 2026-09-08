// =====================================================
// BACKEND (Apps Script) - CADASTRO DE CHAMADO
// Chamado pelo cliente (CadastroChamadoFormJS) via google.script.run
// =====================================================

/**
 * Salva um novo chamado em tbl_chamados e registra a abertura em
 * tbl_chamado_historico. Exige Patrimônio e/ou Localização (validado aqui
 * de novo, por segurança, mesmo já validado no cliente). Equipamento e
 * peças são guardados só por ID (nunca duplica dado de
 * - Equipamento: localizado em tbl_equipamentos pelo Patrimônio digitado;
 *   se não achar por Patrimônio, tenta pela Localização (só resolve se
 *   bater com exatamente 1 equipamento). Se não resolver nenhum dos dois,
 *   o chamado é salvo mesmo assim, sem vínculo (e o cliente é avisado).
 * - Peças: várias, vêm do cliente como texto livre (Nome + opcionais); o
 *   com exatamente 1) e grava os IDs achados na mesma célula separados por
 *   "-" (ex: "1-3-5"). Peça sem ID resolvido não é linkada, mas não impede
 *   o chamado de ser salvo.
 *
 * Retorna { sucesso: boolean, mensagem: string, id?: number, equipamentoEncontrado?: boolean }
 */
function salvarChamadoBackend(dados) {
  try {
    if (!dados || !String(dados.motivo || '').trim()) {
      return { sucesso: false, mensagem: 'Preencha o motivo do chamado.' };
    }

    const patrimonioDigitado = String(dados.patrimonio || '').trim();
    const localizacaoDigitada = String(dados.localizacao || '').trim();

    if (!patrimonioDigitado && !localizacaoDigitada) {
      return { sucesso: false, mensagem: 'Informe pelo menos o Patrimônio ou a Localização do equipamento.' };
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const abaChamados = ss.getSheetByName(ticketsTableName);
    if (!abaChamados) {
      return { sucesso: false, mensagem: "Aba 'tbl_chamados' não foi encontrada na planilha." };
    }

    const ultimaLinhaPlanilha = abaChamados.getLastRow();
    const ultimaLinha = Math.max(ultimaLinhaPlanilha, firstLineTickets - 1);

    let novoId;
    if (ultimaLinha < firstLineTickets) {
      novoId = 1;
    } else {
      let idAtual = abaChamados.getRange(ultimaLinha, 1).getValue();
      if (idAtual === '' || isNaN(Number(idAtual))) idAtual = 0;
      novoId = Number(idAtual) + 1;
    }

    const dataAtual = Utilities.formatDate(new Date(), 'GMT-3', 'dd/MM/yyyy');

    let equipamentoId = '';
    if (patrimonioDigitado) {
      equipamentoId = buscarEquipamentoIdPorPatrimonio(patrimonioDigitado);
    }
    if (!equipamentoId && localizacaoDigitada) {
      equipamentoId = buscarEquipamentoIdPorLocalizacao(localizacaoDigitada);
    }
    const equipamentoEncontrado = !!equipamentoId;

    const relatorioUrl = salvarArquivoAnexoChamado(dados.relatorio);
    const notaFiscalUrl = salvarArquivoAnexoChamado(dados.notaFiscal);

    // Ordem: ID, ID_EQUIPAMENTO, ID_PECA (sempre vazio), DEFEITO, TIPO,
    // PRIORIDADE, DATA_ABERTURA, ABERTO_POR, ATRIBUIDO_A,
    // DATA_INICIO_ANDAMENTO, DATA_FINALIZACAO, OBSERVACAO, RELATORIO,
    // NOTA_FISCAL, STATUS, DATA_ALTERACAO
    const novaLinha = [
      novoId,
      equipamentoId,
      '',
      dados.motivo,
      dados.tipo || '',
      dados.classificacao || '',
      dataAtual,
      dados.abertoPor || '',
      dados.atribuidoA || '',
      '',
      '',
      dados.descricao || '',
      relatorioUrl,
      notaFiscalUrl,
      'Aberto',
      ''
    ];

    abaChamados.getRange(ultimaLinha + 1, 1, 1, numColumnsTickets).setValues([novaLinha]);

    adicionarHistoricoChamado(novoId, 'Chamado aberto');

    return {
      sucesso: true,
      mensagem: equipamentoEncontrado
        ? 'Chamado aberto com sucesso!'
        : 'Chamado aberto com sucesso! (Não foi possível vincular a um equipamento cadastrado -- confira o Patrimônio/Localização quando o cadastro de Equipamentos estiver mais completo.)',
      id: novoId,
      equipamentoEncontrado: equipamentoEncontrado
    };
  } catch (e) {
    return { sucesso: false, mensagem: 'Erro no servidor: ' + e.message };
  }
}

/**
 * Lista os funcionários de tbl_funcionarios pro campo "Aberto por" do
 * Cadastro de Chamado (mesmo padrão de filtrarFornecedores).
 */
function filtrarFuncionarios() {
  const dados = ReadEmployees();
  return dados.map(linha => ({ id: linha[0], nome: linha[1] }));
}

/**
 * Verifica se existe um equipamento com esse Patrimônio em tbl_equipamentos.
 * Chamado ao sair do campo Patrimônio (evento blur), igual
 * verificarCnpjAoSair() do Cadastro de Fornecedor. Nunca bloqueia o
 * cadastro -- só informa.
 * Retorna { existe, localizacao?, btus?, marca?, modelo?, sequencia? }
 */
function verificarPatrimonioChamado(patrimonio) {
  const patrimonioBuscado = String(patrimonio || '').trim().toLowerCase();
  if (!patrimonioBuscado) return { existe: false };

  const dados = ReadEquipments();
  for (let i = 0; i < dados.length; i++) {
    const patrimonioLinha = String(dados[i][5] || '').trim().toLowerCase();
    if (patrimonioLinha === patrimonioBuscado) {
      return {
        existe: true,
        localizacao: dados[i][7] || '',
        btus: dados[i][3] || '',
        marca: dados[i][2] || '',
        modelo: dados[i][4] || '',
        sequencia: dados[i][6] || ''
      };
    }
  }
  return { existe: false };
}



/**
 * Busca o ID de um equipamento em tbl_equipamentos pelo Patrimônio.
 * Retorna o ID ou '' se não encontrar.
 */
function buscarEquipamentoIdPorPatrimonio(patrimonio) {
  const patrimonioBuscado = String(patrimonio || '').trim().toLowerCase();
  if (!patrimonioBuscado) return '';

  const dados = ReadEquipments();
  for (let i = 0; i < dados.length; i++) {
    const patrimonioLinha = String(dados[i][5] || '').trim().toLowerCase();
    if (patrimonioLinha === patrimonioBuscado) {
      return dados[i][0];
    }
  }
  return '';
}

/**
 * Busca o ID de um equipamento em tbl_equipamentos pela Localização --
 * só resolve se bater com exatamente 1 equipamento (Localização sozinha
 * não é uma chave única, então em caso de ambiguidade não arrisca).
 * Retorna o ID ou '' se não encontrar ou encontrar mais de um.
 */
function buscarEquipamentoIdPorLocalizacao(localizacao) {
  const localizacaoBuscada = String(localizacao || '').trim().toLowerCase();
  if (!localizacaoBuscada) return '';

  const dados = ReadEquipments();
  const encontrados = dados.filter(linha => String(linha[7] || '').trim().toLowerCase() === localizacaoBuscada);

  return (encontrados.length === 1) ? encontrados[0][0] : '';
}

// ID da pasta do Google Drive onde os anexos de chamado (Relatório/Nota
// Fiscal) são salvos. Troque pelo ID da SUA pasta -- abre a pasta no Drive
// e copia o trecho da URL depois de "folders/".
const PASTA_ANEXOS_CHAMADOS_ID = '1Ef7rs5vSw4GQR18W96tzpSsBL1dwcwg8';

/**
 * Salva um anexo (Relatório ou Nota Fiscal) no Google Drive, dentro da
 * pasta fixa PASTA_ANEXOS_CHAMADOS_ID. "arquivo" vem do cliente como
 * { nome, tipo, base64 } (ver lerArquivoComoBase64 em
 * CadastroChamadoFormJS.html) ou null se o campo ficou vazio. Retorna a
 * URL do arquivo no Drive, ou '' se não veio nada.
 *
 * OBS: na primeira vez que isso rodar, o Google vai pedir uma nova
 * autorização (permissão de acesso ao Drive) -- é esperado, só aceitar.
 */
function salvarArquivoAnexoChamado(arquivo) {
  console.log('[anexo] início -- arquivo recebido:', arquivo ? {
    nome: arquivo.nome,
    tipo: arquivo.tipo,
    tamanhoBase64: arquivo.base64 ? arquivo.base64.length : 0
  } : arquivo);

  if (!arquivo || !arquivo.base64) {
    console.log('[anexo] sem arquivo/base64 -- retornando vazio.');
    return '';
  }

  console.log('[anexo] buscando pasta pelo ID:', PASTA_ANEXOS_CHAMADOS_ID);
  const pasta = DriveApp.getFolderById(PASTA_ANEXOS_CHAMADOS_ID);
  console.log('[anexo] pasta encontrada:', pasta.getName());

  let bytes;
  try {
    bytes = Utilities.base64Decode(arquivo.base64);
    console.log('[anexo] base64 decodificado -- bytes:', bytes.length);
  } catch (e) {
    console.log('[anexo] ERRO ao decodificar base64:', e.message);
    throw new Error('Não foi possível ler o arquivo "' + arquivo.nome + '" -- geralmente é o arquivo grande demais pro sistema conseguir enviar de uma vez. Tente um arquivo menor.');
  }

  let blob;
  try {
    blob = Utilities.newBlob(bytes, arquivo.tipo || 'application/octet-stream', arquivo.nome || 'anexo');
    console.log('[anexo] blob criado -- tipo:', arquivo.tipo, 'nome:', arquivo.nome);
  } catch (e) {
    console.log('[anexo] ERRO ao criar o blob:', e.message);
    throw e;
  }

  let arquivoDrive;
  try {
    arquivoDrive = pasta.createFile(blob);
    console.log('[anexo] arquivo criado no Drive -- id:', arquivoDrive.getId());
  } catch (e) {
    console.log('[anexo] ERRO ao criar o arquivo no Drive:', e.message);
    throw e;
  }

  // Compartilhamento é só um "extra" -- se a conta (ex: domínio educacional)
  // bloquear o modo "qualquer pessoa com o link", isso NÃO pode impedir o
  // chamado de ser salvo. Só loga o aviso e segue -- quem tiver acesso à
  // pasta (você) já consegue abrir o arquivo pela URL de qualquer jeito.
  try {
    arquivoDrive.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    console.log('[anexo] compartilhamento configurado.');
  } catch (e) {
    console.log('[anexo] AVISO -- não foi possível configurar "qualquer pessoa com o link" (provavelmente bloqueado pela política da conta). Seguindo sem isso. Erro original:', e.message);
  }

  console.log('[anexo] concluído -- URL:', arquivoDrive.getUrl());
  return arquivoDrive.getUrl();
}

/**
 * Adiciona uma entrada em tbl_chamado_historico pra um chamado.
 */
function adicionarHistoricoChamado(chamadoId, texto) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const abaHistorico = ss.getSheetByName(ticketHistoricoTableName);
  if (!abaHistorico) return;

  const ultimaLinhaPlanilha = abaHistorico.getLastRow();
  const ultimaLinha = Math.max(ultimaLinhaPlanilha, firstLineTicketHistorico - 1);

  let idAtual = (ultimaLinha >= firstLineTicketHistorico) ? abaHistorico.getRange(ultimaLinha, 1).getValue() : 0;
  if (idAtual === '' || isNaN(Number(idAtual))) idAtual = 0;
  const novoId = Number(idAtual) + 1;

  const dataAtual = Utilities.formatDate(new Date(), 'GMT-3', 'dd/MM/yyyy HH:mm');
  const novaLinha = [novoId, chamadoId, texto, dataAtual];
  abaHistorico.getRange(ultimaLinha + 1, 1, 1, numColumnsTicketHistorico).setValues([novaLinha]);
}
