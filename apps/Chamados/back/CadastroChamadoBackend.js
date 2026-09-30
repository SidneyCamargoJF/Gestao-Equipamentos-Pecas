// =====================================================
// BACKEND (Apps Script) - CADASTRO DE CHAMADO
// Chamado pelo cliente (CadastroChamadoFormJS) via google.script.run
// =====================================================

/**
 * Salva um chamado em tbl_chamados -- cria um novo (dados.id vazio) ou
 * atualiza um existente (dados.id preenchido, modo edição), e registra a
 * ação em tbl_chamado_historico. Exige Patrimônio e/ou Localização
 * Equipamento é guardado só por ID (nunca duplica dado de
 * tbl_equipamentos):
 * - Equipamento: localizado em tbl_equipamentos pelo Patrimônio digitado;
 *   se não achar por Patrimônio, tenta pela Localização.
 *   
 * - No modo edição, campos que não fazem parte do formulário (ID_PECA,
 *   DATA_ABERTURA, DATA_INICIO_ANDAMENTO, DATA_FINALIZACAO, STATUS) são
 *   preservados como estavam
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

    let equipamentoId = '';
    if (patrimonioDigitado) {
      equipamentoId = buscarEquipamentoIdPorPatrimonio(patrimonioDigitado);
    }
    if (!equipamentoId && localizacaoDigitada) {
      equipamentoId = buscarEquipamentoIdPorLocalizacao(localizacaoDigitada);
    }
    const equipamentoEncontrado = !!equipamentoId;

    const dataAtual = Utilities.formatDate(new Date(), 'GMT-3', 'dd/MM/yyyy');
    const idEdicao = dados.id ? Number(dados.id) : null;

    // ===== MODO EDIÇÃO =====
    if (idEdicao) {
      const todasLinhas = ReadTickets();
      const idx = todasLinhas.findIndex(l => Number(l[0]) === idEdicao);
      if (idx === -1) {
        return { sucesso: false, mensagem: 'Chamado não encontrado para edição (ID ' + idEdicao + ').' };
      }

      const linhaReal = idx + firstLineTickets;
      // cópia do conteúdo da linha atual
      const linhaAtual = todasLinhas[idx];

      const linhaAtualizada = [
        idEdicao,
        equipamentoId,
        dados.motivo,
        dados.tipo || '',
        dados.classificacao || '',
        linhaAtual[5],
        dados.abertoPor || '',
        dados.atribuidoA || '',
        linhaAtual[8],
        linhaAtual[9],
        dados.descricao || '',
        linhaAtual[11],
        dataAtual
      ];

      abaChamados.getRange(linhaReal, 1, 1, numColumnsTickets).setValues([linhaAtualizada]);
      adicionarHistoricoSistema(idEdicao, 'Chamado editado');

      //dados.relatorios é uma lista dos arquivos que vieram do front em forma de objeto {nome, tipo, base64
      // o || [] se estiver vazio troca para um alista vazia para nao quebrar o map
      //.map passa por cada item dessa lista, e a cada volta o item fica guardado no 'arquivo', map constrói uma lista nova
      //chama a função de salvar anexo, passando o id, o texto do tipo e o arquivo 
      // e a variavel do começo guarda a lista nova com o resultado do upload específico
      const respostasRelatorios = (dados.relatorios || []).map(arquivo => adicionarAnexoChamado(idEdicao, 'Relatório', arquivo));
      const respostasNotasFiscais = (dados.notasFiscais || []).map(arquivo => adicionarAnexoChamado(idEdicao, 'Nota Fiscal', arquivo));
      const existeAnexoDuplicado = respostasRelatorios.concat(respostasNotasFiscais).some(r => r && r.duplicado);

      return {
        sucesso: true,
        mensagem: 'Chamado atualizado com sucesso!',
        id: idEdicao,
        equipamentoEncontrado: equipamentoEncontrado,
        duplicado: existeAnexoDuplicado
      };
    }

    // ===== MODO CRIAÇÃO =====
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

    // Ordem: ID, ID_EQUIPAMENTO, DEFEITO, TIPO, PRIORIDADE, DATA_ABERTURA,
    // ABERTO_POR, ATRIBUIDO_A, DATA_INICIO_ANDAMENTO, DATA_FINALIZACAO,
    // OBSERVACAO, STATUS, DATA_ALTERACAO (13 colunas -- RELATORIO/NOTA_FISCAL
    const novaLinha = [
      novoId,
      equipamentoId,
      dados.motivo,
      dados.tipo || '',
      dados.classificacao || '',
      dataAtual,
      dados.abertoPor || '',
      dados.atribuidoA || '',
      '',
      '',
      dados.descricao || '',
      'Aberto',
      ''
    ];

    abaChamados.getRange(ultimaLinha + 1, 1, 1, numColumnsTickets).setValues([novaLinha]);

    adicionarHistoricoSistema(novoId, 'Chamado aberto');

    //map guarda o retorno de cada chamada numa lista nova
    const respostasRelatorios = (dados.relatorios || []).map(arquivo => adicionarAnexoChamado(novoId, 'Relatório', arquivo));
    const respostasNotasFiscais = (dados.notasFiscais || []).map(arquivo => adicionarAnexoChamado(novoId, 'Nota Fiscal', arquivo));
    const existeAnexoDuplicado = respostasRelatorios.concat(respostasNotasFiscais).some(r => r && r.duplicado);


    return {
      sucesso: true,
      mensagem: equipamentoEncontrado
        ? 'Chamado aberto com sucesso!'
        : 'Chamado aberto com sucesso! (Não foi possível vincular a um equipamento. Confira o Patrimônio/Localização e edite o chamado posteriormente.)',
      id: novoId,
      equipamentoEncontrado: equipamentoEncontrado,
      duplicado: existeAnexoDuplicado
    };
  } catch (e) {
    return { sucesso: false, mensagem: 'Erro no servidor: ' + e.message };
  }
}

/**
 * Busca um chamado pelo ID pra pré-preencher o formulário de Cadastro no
 * modo edição. 
 * Retorna null se não encontrar.
 */
function buscarChamadoParaEdicao(idInput) {
  try {
    const idBuscado = Number(idInput);
    const dados = ReadTickets();
    const linha = dados.find(l => Number(l[0]) === idBuscado);
    if (!linha) return null;

    let patrimonio = '', localizacao = '', marca = '', modelo = '', capacidade = '';
    if (linha[1]) {
      const equipamentos = ReadEquipments();
      const equip = equipamentos.find(e => Number(e[0]) === Number(linha[1]));
      if (equip) {
        patrimonio = equip[5] || '';
        localizacao = equip[7] || '';
        marca = equip[2] || '';
        modelo = equip[4] || '';
        capacidade = equip[3] || '';
      }
    }

    return {
      id: linha[0],
      motivo: linha[2],
      tipo: linha[3],
      classificacao: linha[4],
      abertoPor: linha[6],
      atribuidoA: linha[7],
      descricao: linha[10],
      patrimonio: patrimonio,
      localizacao: localizacao,
      marca: marca,
      modelo: modelo,
      capacidade: capacidade
    };
  } catch (e) {
    return null;
  }
}

function filtrarFuncionarios() {
  const dados = ReadEmployees();
  return dados.map(linha => ({ id: linha[0], nome: linha[1] }));
}

function verificarPatrimonioChamado(patrimonio) {
  const patrimonioBuscado = String(patrimonio || '').trim().toLowerCase();
  if (!patrimonioBuscado) return { existe: false };

  const dados = ReadEquipments();
  for (let i = 0; i < dados.length; i++) {
    const patrimonioLinha = String(dados[i][5] || '').trim().toLowerCase();
    if (patrimonioLinha === patrimonioBuscado) {
      return {
        existe: true,
        nome: dados[i][1] || '',
        localizacao: dados[i][7] || '',
        capacidade: dados[i][3] || '',
        marca: dados[i][2] || '',
        modelo: dados[i][4] || '',
        sequencia: dados[i][6] || ''
      };
    }
  }
  return { existe: false };
}

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
 * Salva um anexo no Google Drive, dentro da
 * pasta fixa PASTA_ANEXOS_CHAMADOS_ID. "arquivo" vem do cliente como
 * { nome, tipo, base64 } (ver lerArquivoComoBase64 em
 * CadastroChamadoFormJS.html) ou null se o campo ficou vazio. Retorna a
 * URL do arquivo no Drive, ou '' se não veio nada.
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
    const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, bytes);
    let hashArquivo = '';
    for (let i = 0; i < digest.length; i++) {
      let byte = digest[i];
      if (byte < 0) byte += 256;
      let hex = byte.toString(16);
      if (hex.length === 1) hex = '0' + hex;
      hashArquivo += hex;
    }
    arquivo.hash = hashArquivo;

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
 * Adiciona uma entrada em tbl_chamado_anexos para um anexo.
 */
function adicionarAnexoChamado(chamadoId, tipo, arquivo) {
  try {
    if (arquivo == null) {
      return { sucesso: false, mensagem: 'Escolha um arquivo antes de adicionar.' };
    }

    const dataAtual =  Utilities.formatDate(new Date(), 'GMT-3', "yyyy-MM-dd_HH-mm-ss");
    const nomeDoArquivo = dataAtual + '_'  + arquivo.nome;
    arquivo.nome = nomeDoArquivo;

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const abaAnexos = ss.getSheetByName(ticketAnexosTableName);
    if (!abaAnexos) {
      return { sucesso: false, mensagem: "Aba 'tbl_chamado_anexos' não encontrada na planilha." };
    }

    const url = salvarArquivoAnexoChamado(arquivo);
    console.log('[anexo-duplicado] hash do arquivo que está sendo salvo agora:', arquivo.hash);

    const anexosAtivosDoChamado = ReadTicketAnexos().filter(linha =>
      Number(linha[1]) === Number(chamadoId) && !linha[7]
    );
    console.log('[anexo-duplicado] chamadoId:', chamadoId, '-- hashes já salvos pra esse chamado:',
      anexosAtivosDoChamado.map(linha => linha[5]));

    const jaExiste = anexosAtivosDoChamado.some(linha => linha[5] === arquivo.hash);
    console.log('[anexo-duplicado] resultado final (jaExiste/duplicado):', jaExiste);

    const ultimaLinhaPlanilha = abaAnexos.getLastRow();
    const ultimaLinha = Math.max(ultimaLinhaPlanilha, firstLineTicketAnexos - 1);

    let idAtual = (ultimaLinha >= firstLineTicketAnexos) ? abaAnexos.getRange(ultimaLinha, 1).getValue() : 0;
    if (idAtual === '' || isNaN(Number(idAtual))) idAtual = 0;
    const novoId = Number(idAtual) + 1;

    const dataUpload = Utilities.formatDate(new Date(), 'GMT-3', 'dd/MM/yyyy HH:mm');
    const novaLinha = [novoId, chamadoId, tipo, arquivo.nome, url, arquivo.hash, dataUpload, ''];
    abaAnexos.getRange(ultimaLinha + 1, 1, 1, numColumnsTicketAnexos).setValues([novaLinha]);

    adicionarHistoricoSistema(chamadoId, 'Anexo adicionado: "' + arquivo.nome + '" (' + tipo + ')');

    return { sucesso: true, mensagem: 'Anexo adicionado com sucesso.', duplicado: jaExiste };
  } catch (e) {
    return { sucesso: false, mensagem: 'Erro no servidor: ' + e.message };
  }
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
  const novaLinha = [novoId, chamadoId, texto, dataAtual, ''];
  abaHistorico.getRange(ultimaLinha + 1, 1, 1, numColumnsTicketHistorico).setValues([novaLinha]);
}

// Prefixo usado pra marcar entradas de histórico geradas automaticamente
// pelo sistema (abertura, troca de status, desativação...), pra diferenciar
// de anotações manuais -- sem precisar de coluna nova na planilha. O
// prefixo nunca aparece pro usuário (buscarHistoricoChamado remove antes
// de devolver pro cliente).
const HISTORICO_CHAMADO_PREFIXO_SISTEMA = '[SISTEMA] ';
const HISTORICO_CHAMADO_PREFIXO_EXCLUIDA = '[EXCLUIDA] ';

function adicionarHistoricoSistema(chamadoId, texto) {
  adicionarHistoricoChamado(chamadoId, HISTORICO_CHAMADO_PREFIXO_SISTEMA + texto);
}


