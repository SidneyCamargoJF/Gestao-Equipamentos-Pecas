// =====================================================
// ANEXOS -- backend genérico compartilhado entre Chamados, Contrato e
// qualquer outra tela que precise anexar arquivo a um registro.
// Movido de CadastroChamadoBackend.js / ConsultaChamadoBackend.js. Cada
// módulo mantém uma TABELA DE ANEXOS PRÓPRIA (tbl_chamado_anexos,
// tbl_contrato_anexos, ...) com o mesmo layout de 8 colunas:
// [ID, ID_REGISTRO, TIPO, NOME_ARQUIVO, URL, HASH, DATA_UPLOAD, DATA_EXCLUSAO]
// e expõe só funções "wrapper" fininhas (ex: adicionarAnexoChamado,
// adicionarAnexoContrato) que chamam as genéricas abaixo passando o nome da
// própria tabela -- não duplicar a lógica de novo em cada módulo.
// =====================================================

// ID da pasta do Google Drive onde os anexos de TODOS os módulos são salvos.
// Troque pelo ID da SUA pasta -- abre a pasta no Drive e copia o trecho da
// URL depois de "folders/".
const PASTA_ANEXOS_ID = '1Ef7rs5vSw4GQR18W96tzpSsBL1dwcwg8';

/**
 * Salva um anexo no Google Drive, dentro da pasta fixa PASTA_ANEXOS_ID.
 * "arquivo" vem do cliente como { nome, tipo, base64 } (ver
 * lerArquivoComoBase64/lerArquivosComoBase64) ou null se o campo ficou
 * vazio. Retorna a URL do arquivo no Drive, ou '' se não veio nada.
 * Efeito colateral: preenche arquivo.hash (MD5 do conteúdo), usado pela
 * checagem de duplicidade em adicionarAnexoGenerico.
 */
function salvarArquivoAnexo(arquivo) {
  if (!arquivo || !arquivo.base64) {
    return '';
  }

  const pasta = DriveApp.getFolderById(PASTA_ANEXOS_ID);

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
  } catch (e) {
    throw new Error('Não foi possível ler o arquivo "' + arquivo.nome + '" -- geralmente é o arquivo grande demais pro sistema conseguir enviar de uma vez. Tente um arquivo menor.');
  }

  const blob = Utilities.newBlob(bytes, arquivo.tipo || 'application/octet-stream', arquivo.nome || 'anexo');
  const arquivoDrive = pasta.createFile(blob);

  try {
    arquivoDrive.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (e) {
    // Bloqueado pela política da conta -- segue sem isso, o anexo ainda é salvo.
  }

  return arquivoDrive.getUrl();
}

/**
 * Adiciona uma linha na tabela de anexos de um módulo.
 * config: { tabelaAnexos, idRegistro, tipo, arquivo, firstLine, numColumns }
 * Retorna { sucesso, mensagem, duplicado, nomeArquivo }.
 */
function adicionarAnexoGenerico(config) {
  try {
    const tabelaAnexos = config.tabelaAnexos;
    const idRegistro = config.idRegistro;
    const tipo = config.tipo;
    const arquivo = config.arquivo;
    const firstLine = config.firstLine;
    const numColumns = config.numColumns;

    if (arquivo == null) {
      return { sucesso: false, mensagem: 'Escolha um arquivo antes de adicionar.' };
    }

    const dataAtual = Utilities.formatDate(new Date(), 'GMT-3', "yyyy-MM-dd_HH-mm-ss");
    const nomeDoArquivo = dataAtual + '_' + arquivo.nome;
    arquivo.nome = nomeDoArquivo;

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const abaAnexos = ss.getSheetByName(tabelaAnexos);
    if (!abaAnexos) {
      return { sucesso: false, mensagem: "Aba '" + tabelaAnexos + "' não encontrada na planilha." };
    }

    const url = salvarArquivoAnexo(arquivo);

    const anexosAtivosDoRegistro = ReadSheet(tabelaAnexos, firstLine, numColumns).filter(linha =>
      Number(linha[1]) === Number(idRegistro) && !linha[7]
    );
    const jaExiste = anexosAtivosDoRegistro.some(linha => linha[5] === arquivo.hash);

    const ultimaLinhaPlanilha = abaAnexos.getLastRow();
    const ultimaLinha = Math.max(ultimaLinhaPlanilha, firstLine - 1);

    let idAtual = (ultimaLinha >= firstLine) ? abaAnexos.getRange(ultimaLinha, 1).getValue() : 0;
    if (idAtual === '' || isNaN(Number(idAtual))) idAtual = 0;
    const novoId = Number(idAtual) + 1;

    const dataUpload = Utilities.formatDate(new Date(), 'GMT-3', 'dd/MM/yyyy HH:mm');
    const novaLinha = [novoId, idRegistro, tipo, arquivo.nome, url, arquivo.hash, dataUpload, ''];
    abaAnexos.getRange(ultimaLinha + 1, 1, 1, numColumns).setValues([novaLinha]);

    return { sucesso: true, mensagem: 'Anexo adicionado com sucesso.', duplicado: jaExiste, nomeArquivo: arquivo.nome };
  } catch (e) {
    return { sucesso: false, mensagem: 'Erro no servidor: ' + e.message };
  }
}

/**
 * Lista os anexos ativos (não excluídos) de um registro, mais recente
 * primeiro.
 */
function buscarAnexosGenerico(tabelaAnexos, idRegistro, firstLine, numColumns) {
  const idBuscado = Number(idRegistro);
  const dados = ReadSheet(tabelaAnexos, firstLine, numColumns);

  return dados
    .filter(linha => Number(linha[1]) === idBuscado)
    .filter(linha => !linha[7])
    .map(linha => ({
      id: linha[0],
      tipo: linha[2],
      nomeArquivo: linha[3],
      url: linha[4],
      // Se a planilha converteu esse valor pra Date de verdade (acontece
      // mesmo escrevendo string via setValues, se a coluna já tiver
      // formatação de data), precisa virar texto antes de devolver pro
      // cliente -- um Date "cru" dentro de uma lista de objetos faz o
      // google.script.run falhar a serialização e devolver null, sem erro
      // nenhum visível.
      dataUpload: (linha[6] instanceof Date) ? Utilities.formatDate(linha[6], 'GMT-3', 'dd/MM/yyyy HH:mm') : linha[6]
    }))
    .reverse();
}

/**
 * Exclusão lógica (marca DATA_EXCLUSAO, não apaga a linha).
 * Retorna { sucesso, mensagem, idRegistro, tipo, nomeArquivo } pro chamador
 * decidir se registra em algum histórico próprio do módulo.
 */
function excluirAnexoGenerico(tabelaAnexos, anexoId, firstLine, numColumns) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const abaAnexos = ss.getSheetByName(tabelaAnexos);
    if (!abaAnexos) {
      return { sucesso: false, mensagem: "Aba '" + tabelaAnexos + "' não encontrada na planilha." };
    }

    const idBuscado = Number(anexoId);
    if (!idBuscado) {
      return { sucesso: false, mensagem: 'ID do anexo inválido.' };
    }
    const dados = ReadSheet(tabelaAnexos, firstLine, numColumns);

    for (let i = 0; i < dados.length; i++) {
      if (Number(dados[i][0]) === idBuscado) {
        const linhaReal = i + firstLine;
        const dataAtual = Utilities.formatDate(new Date(), "GMT-3", "dd/MM/yyyy");

        abaAnexos.getRange(linhaReal, 8).setValue(dataAtual); // coluna 8 = DATA_EXCLUSAO em todas as tabelas de anexo
        abaAnexos.getRange(linhaReal, 1, 1, numColumns).setBackground("#F4CCCC");

        return {
          sucesso: true,
          mensagem: 'Anexo excluído da interface, dado permanece no banco de dados.',
          idRegistro: dados[i][1],
          tipo: dados[i][2],
          nomeArquivo: dados[i][3]
        };
      }
    }
    return { sucesso: false, mensagem: 'Anexo não encontrado.' };
  } catch (e) {
    return { sucesso: false, mensagem: 'Erro no servidor: ' + e.message };
  }
}
