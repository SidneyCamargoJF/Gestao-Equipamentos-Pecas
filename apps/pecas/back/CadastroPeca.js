// ===== FUNÇÕES DO SERVIDOR (Backend .gs) =====

function loadBrands() {
  try {
    // Substitua 'tbl_marcas' pelo nome real da sua aba de marcas
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("tbl_marcas");
    if (!sheet) return [];
    const data = sheet.getDataRange().getValues();
    // Pula o cabeçalho (linha 1) e pega a coluna B (índice 1) ou A (índice 0) onde fica o nome
    return data.slice(1).map(r => r[1]).filter(Boolean);
  } catch (e) {
    Logger.log("Erro ao carregar marcas: " + e.message);
    return [];
  }
}

function loadLocations() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("tbl_localizacoes");
    if (!sheet) return [];
    const data = sheet.getDataRange().getValues();
    return data.slice(1).map(r => r[1]).filter(Boolean);
  } catch (e) {
    Logger.log("Erro ao carregar localizações: " + e.message);
    return [];
  }
}

function loadSuppliers() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("tbl_fornecedores");
    if (!sheet) return [];
    const data = sheet.getDataRange().getValues();
    return data.slice(1).map(r => r[1]).filter(Boolean);
  } catch (e) {
    Logger.log("Erro ao carregar fornecedores: " + e.message);
    return [];
  }
}

function salvarPeca(dadosPeca) {
  try {
    const planilha = SpreadsheetApp.getActiveSpreadsheet();
    let abaRegistroPecas = planilha.getSheetByName("tbl_pecas");

    if (!abaRegistroPecas) {
      return { sucesso: false, mensagem: "Aba 'tbl_pecas' não foi encontrada na planilha." };
    }

    if (!dadosPeca.nome || dadosPeca.nome.trim() === "") {
      return { sucesso: false, mensagem: "O campo 'Nome da Peça' é obrigatório." };
    }

    if (dadosPeca.id) {
      const idBuscado = Number(dadosPeca.id)
      const ultimaLinha = abaRegistroPecas.getLastRow();

      if (ultimaLinha >= firstLineParts) {
        const numLinhas = ultimaLinha - firstLineParts + 1;
        const idExistentes = abaRegistroPecas.getRange(firstLineParts, 1, numLinhas, 1).getValues();

        for (let i = 0; i < idExistentes.length; i++){
          if (Number(idExistentes[i][0]) === idBuscado) {
            const linhaReal = i + firstLineParts;

            const linhaAtualizada = [
              idBuscado,
              dadosPeca.nome,
              dadosPeca.marca,
              dadosPeca.modelo,
              dadosPeca.capacidade,
              dadosPeca.numero_serie,
              dadosPeca.local,
              dadosPeca.fornecedor,
              dadosPeca.notaFiscal,
              dadosPeca.dataNotaFiscal,
              dadosPeca.garantia,
              dadosPeca.dtGarantia,
              dadosPeca.modalidade,
              dadosPeca.valor,
              dadosPeca.seiNum
            ];

            abaRegistroPecas.getRange(linhaReal, 1, 1, linhaAtualizada.length).setValues([linhaAtualizada]);
            return { sucesso: true, mensagem: "Peça aualizada com sucesso!", id: idBuscado};
          }
        }
      }
      return { sucesso: false, mensagem: "Peça não econtrada para edição (ID "+ idBuscado +")"};
    }

    const ultimaLinha = abaRegistroPecas.getLastRow();
    let novoId = 1;

    if (ultimaLinha > 1) {
      const ultimoIdVal = abaRegistroPecas.getRange(ultimaLinha, 1).getValue();
      novoId = isNaN(ultimoIdVal) ? 1 : Number(ultimoIdVal) + 1;
    }

    const dataHoje = Utilities.formatDate(new Date(), "GMT-3", "dd/MM/yyyy");

    const linhaNova = [
      novoId,
      dadosPeca.nome,
      dadosPeca.marca,
      dadosPeca.modelo,
      dadosPeca.capacidade,
      dadosPeca.numero_serie,
      dadosPeca.local,
      dadosPeca.fornecedor,
      dadosPeca.notaFiscal,
      dadosPeca.dataNotaFiscal,
      dadosPeca.garantia,
      dadosPeca.dtGarantia,
      dadosPeca.modalidade,
      dadosPeca.valor,
      dadosPeca.seiNum,
      dataHoje
    ];

    abaRegistroPecas.appendRow(linhaNova);

    return { sucesso: true, mensagem: "Peça cadastrada com sucesso!", id: novoId };

  } catch (e) {
    Logger.log("Erro ao salvar peça: " + e.message);
    return { sucesso: false, mensagem: "Erro no servidor: " + e.message };
  }
}

function buscarPecaPorId(id) {
  try {
    const idBuscado = Number(id);
    if (!idBuscado) return null;

    const dados = ReadParts();
    if (!dados) return null;

    for (let i = 0; i < dados.length; i++) {
      if (Number(dados[i][partsIdCol]) === idBuscado) {
        const linha = dados[i];
        return {
          id: idBuscado,
          nome: String(linha[partsNameCol] || ''),
          marca: String(linha[partsBrandCol] || ''),
          modelo: String(linha[partsModelCol] || ''),
          capacidade: String(linha[partsCapacityCol] || ''),
          numero_serie: String(linha[partsNSCol] || ''),
          local: String(linha[partsLocalCol] || ''),
          fornecedor: String(linha[partsSuplierCol] || ''),
          notaFiscal: String(linha[partsNumNFCol] || ''),
          dataNotaFiscal: converterParaInputDate(linha[partsDtNFCol]),
          garantia: String(linha[partsGarantiaCol] || ''),
          dtGarantia: converterParaInputDate(linha[partsDtGarantiaCol]),
          modalidade: String(linha[partsModalidadeCol] || ''),
          valor: linha[partsValueCol],
          seiNum: String(linha[partsSEINumCol] || '')
        };
      }
    }

    return null;
  } catch (e) {
    Logger.log("Erro ao buscar peça por ID: " + e.message);
    return null;
  }
}

/**
 * Converte uma célula (Date, "yyyy-MM-dd" ou "dd/MM/yyyy") para o formato
 * "yyyy-MM-dd" exigido por <input type="date">. Devolve "" se não der pra
 * reconhecer o valor.
 */
function converterParaInputDate(valorCelula) {
  if (!valorCelula) return '';

  if (valorCelula instanceof Date) {
    return Utilities.formatDate(valorCelula, "GMT-3", "yyyy-MM-dd");
  }

  const texto = String(valorCelula).trim();
  if (!texto) return '';

  if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) return texto;

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(texto)) {
    const partes = texto.split('/');
    return partes[2] + '-' + partes[1] + '-' + partes[0];
  }

  return '';
}

// Funções para carregar as opções dos selects
function buscarMarcasAtivas() {
  var marcas = filtrarMarcas({});
  const marcasAtivas = marcas
    .filter(m => !m.desativada && m.marca)
    .map(m => m.marca);
  return Array.from(new Set(marcasAtivas));
}