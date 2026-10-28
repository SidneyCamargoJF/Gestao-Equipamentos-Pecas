function filtrarContratos(criterios) {
  let dados = ReadContracts();
  let res = [];

  let numeroBuscado = (criterios && criterios.numero) ? String(criterios.numero).trim().toLowerCase() : "";
  let nomeBuscado = (criterios && criterios.contrato) ? String(criterios.contrato).trim().toLowerCase() : "";
  let seiBuscado = (criterios && criterios.sei) ? String(criterios.sei).trim().toLowerCase() : "";
  let empresaBuscada = (criterios && criterios.empresa) ? String(criterios.empresa).trim().toLowerCase() : "";
  let situacaoBuscada = (criterios && criterios.situacao) ? String(criterios.situacao).trim().toLowerCase() : "";

  let hoje = new Date();

  let idsComAnexo = new Set(
    ReadContractsAnexos()
      .filter(linha => !linha[contractsAnexosDataExclusaoCol])
      .map(linha => Number(linha[contractsAnexosIdContratoCol]))
  );

  for (let i = 0; i < dados.length; i++) {
    let linha = dados[i];
    if (!linha[contractIdCol]) continue;

    let colNumero = String(linha[contractNumberCol] || '').trim().toLowerCase();
    let colNome = String(linha[contractNameCol] || '').trim().toLowerCase();
    let colSei = String(linha[contractSEICol] || '').trim().toLowerCase();
    let colEmpresa = String(linha[contractEmpresaCol] || '').trim().toLowerCase();
    let situacao = 'ativo';

    if (linha[contractDataEncerramento]) {
      situacao = 'encerrado';
    } else {
      const dtFinal = linha[contractDataFinalCol] ? new Date(linha[contractDataFinalCol]) : null;
      const diasParaVencer = dtFinal ? Math.floor((dtFinal - hoje) / (1000 * 60 * 60 * 24)) : null;
      if (dtFinal) {
        if (diasParaVencer < 0) situacao = 'vencido';
        else if (diasParaVencer <= 30) situacao = 'vencendo';
      }
    }

    let cNumero = (numeroBuscado === "" || colNumero.includes(numeroBuscado));
    let cNome = (nomeBuscado === "" || colNome.includes(nomeBuscado));
    let cSei = (seiBuscado === "" || colSei.includes(seiBuscado));
    let cEmpresa = (empresaBuscada === "" || colEmpresa.includes(empresaBuscada));
    let cSituacao = (situacaoBuscada === "" || situacao === situacaoBuscada);

    if (cNumero && cNome && cSei && cEmpresa && cSituacao) {
      res.push({
        id: linha[contractIdCol],
        numero: linha[contractNumberCol],
        contrato: linha[contractNameCol],
        sei: linha[contractSEICol],
        empresa: linha[contractEmpresaCol],
        valor: linha[contractValorCol],
        dataInicial: linha[contractDataInicialCol],
        dataFinal: linha[contractDataFinalCol],
        situacao: situacao,
        desativado: String(linha[contractActiveCol] || '').trim().toUpperCase() !== 'Y',
        temAnexo: idsComAnexo.has(Number(linha[contractIdCol]))
      });
    }
  }

  return res;
}

function desativarContrato(idInput) {
  try{
    const idBuscado = Number(idInput);
    if(!idBuscado) {
      return { sucesso: false, mensagem: "ID do contrato inválido." };
    }

    const planilha = SpreadsheetApp.getActiveSpreadsheet();
    const abaContratos = planilha.getSheetByName("tbl_contratos");
    if(!abaContratos) {
      return { sucesso: false, mensagem:"Aba 'tbl_contratos' não foi encontrada na planilha."}
    }

    const dados = ReadContracts();

    for(let i = 0; i < dados.length; i++) {
      if (Number(dados[i][0]) === idBuscado) {
        const linhaReal = i + firstLineContracts;
        const dataAtual = Utilities.formatDate(new Date(), "GMT-3", "dd/MM/yyyy");
        abaContratos.getRange(linhaReal, contractDataAletracaoCol + 1).setValue(dataAtual);
        abaContratos.getRange(linhaReal, contractActiveCol + 1).setValue("N");
        abaContratos.getRange(linhaReal, 1, 1, numColumnsContracts).setBackground("#F4CCCC");
        return { sucesso: true, mensagem: "Contrato desativado com sucesso." };
      }
    }
    return { sucesso: false, mensagem: "Contrato não encontrado (ID " + idBuscado + ")." };
  } catch (e) {
    return {sucesso: false, mensagem: "Erro no servidor: " + e.message };
  }
}

function reativarContrato(idInput) {
  try {
    const idBuscado = Number(idInput);
    if (!idBuscado) {
      return { sucesso: false, mensagem: "ID do contrato inválido." };
    }

    const planilha = SpreadsheetApp.getActiveSpreadsheet();
    const abaContratos = planilha.getSheetByName("tbl_contratos");
    if (!abaContratos) {
      return { sucesso: false, mensagem: "Aba 'tbl_contratos' não foi encontrada na planilha." };
    }

    const dados = ReadContracts();

    for (let i = 0; i < dados.length; i++) {
      if (Number(dados[i][0]) === idBuscado) {
        const linhaReal = i + firstLineContracts;
        const dataAtual = Utilities.formatDate(new Date(), "GMT-3", "dd/MM/yyyy");
        abaContratos.getRange(linhaReal, contractDataAletracaoCol + 1).setValue(dataAtual);
        abaContratos.getRange(linhaReal, contractActiveCol + 1).setValue("Y");
        abaContratos.getRange(linhaReal, 1, 1, numColumnsContracts).setBackground(null);
        return { sucesso: true, mensagem: "Contrato reativado com sucesso." };
      }
    }
    return { sucesso: false, mensagem: "Contrato não encontrado (ID " + idBuscado + ")." };
  } catch (e) {
    return { sucesso: false, mensagem: "Erro no servidor: " + e.message };
  }
}
