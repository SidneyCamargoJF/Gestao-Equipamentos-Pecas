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

// Funções para carregar as opções dos selects
function buscarMarcasAtivas() {
  var marcas = filtrarMarcas({});
  const marcasAtivas = marcas
    .filter(m => !m.desativada && m.marca)
    .map(m => m.marca);
  return Array.from(new Set(marcasAtivas));
}