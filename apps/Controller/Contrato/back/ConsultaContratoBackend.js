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

/**
 * Detalhes completos de um contrato pra tela de "Ver detalhes" (Consulta).
 * Separada de buscarContratoParaEdicao() (Cadastro) de propósito -- aqui é
 * só leitura, então cada pedaço (equipamentos/serviços/produtos/checklist/
 * SLA) é blindado individualmente e os valores são sempre forçados pra
 * String/Number explicitamente, pra nunca devolver undefined/NaN que
 * poderia quebrar a serialização do google.script.run sem erro nenhum
 * aparecer no log do servidor (foi exatamente isso que aconteceu com um
 * contrato novo: a função terminava sem lançar erro, mas o front recebia
 * nada -- o JSON.parse(JSON.stringify(...)) no final força esse problema
 * a aparecer AQUI, com log, em vez de silenciosamente no cliente).
 * Retorna { sucesso: true, contrato: {...} } ou { sucesso: false, mensagem }.
 */
function buscarDetalhesContrato(idInput) {
  try {
    const idBuscado = Number(idInput);
    const todasLinhas = ReadContracts();
    const linha = todasLinhas.find(function (l) { return Number(l[contractIdCol]) === idBuscado; });

    if (!linha) {
      console.error('buscarDetalhesContrato: ID ' + idBuscado + ' não encontrado. IDs existentes: [' +
        todasLinhas.map(function (l) { return l[contractIdCol]; }).join(', ') + ']');
      return { sucesso: false, mensagem: 'Contrato não encontrado (ID ' + idBuscado + ').' };
    }

    const contrato = {
      id: idBuscado,
      numero: String(linha[contractNumberCol] || ''),
      contrato: String(linha[contractNameCol] || ''),
      sei: String(linha[contractSEICol] || ''),
      empresa: String(linha[contractEmpresaCol] || ''),
      objeto: String(linha[contractObjetoCol] || ''),
      observacoes: String(linha[contractObservacoesCol] || ''),
      valor: isNaN(Number(linha[contractValorCol])) ? 0 : Number(linha[contractValorCol]),
      dataInicial: String(linha[contractDataInicialCol] || ''),
      dataFinal: String(linha[contractDataFinalCol] || ''),
      dataEncerramento: String(linha[contractDataEncerramento] || ''),
      contatoEmpresa: String(linha[contractContatoEmpresaCol] || ''),
      telefone: String(linha[contractTelefoneCol] || ''),
      email: String(linha[contractEmailCol] || ''),
      gestor: String(linha[contractGestorCol] || ''),
      equipamentos: [],
      servicos: [],
      produtos: [],
      checklist: [],
      sla: []
    };

    try {
      const equipamentosTodos = ReadEquipments();
      contrato.equipamentos = ReadContractsEquipaments()
        .filter(function (l) { return Number(l[contractsEquipamentsIdContratoCol]) === idBuscado && !l[contractsEquipamentsDataExclusaoCol]; })
        .map(function (l) {
          const idEquip = Number(l[contractEquipamentsIdEquipamentCol]);
          const equip = equipamentosTodos.find(function (e) { return Number(e[0]) === idEquip; });
          if (!equip) return null;
          return {
            equipamento: String(equip[1] || ''),
            marca: String(equip[2] || ''),
            capacidade: String(equip[3] || ''),
            modelo: String(equip[4] || ''),
            patrimonio: String(equip[5] || ''),
            localizacao: String(equip[7] || '')
          };
        })
        .filter(function (e) { return e !== null; });
    } catch (e) {
      console.error('buscarDetalhesContrato: equipamentos (contrato ' + idBuscado + '): ' + e.message);
    }

    try {
      contrato.servicos = ReadContractsServicos()
        .filter(function (l) { return Number(l[contractsServicosIdContratoCol]) === idBuscado && !l[contractsServicosDataExclusaoCol]; })
        .map(function (l) {
          const valorUnitario = lerValorUnitarioServico(l);
          return {
            tipoManutencao: String(l[contractsServicosTipoManutencaoCol] || ''),
            categoria: String(l[contractsServicosCategoriaCol] || ''),
            tipo: String(l[contractsServicosTipoCol] || ''),
            capacidade: String(l[contractsServicosCapacidadeCol] || ''),
            periodicidade: String(l[contractsServicosPeriodicidadeCol] || ''),
            valorUnitario: (valorUnitario === '' || isNaN(Number(valorUnitario))) ? '' : Number(valorUnitario)
          };
        });
    } catch (e) {
      console.error('buscarDetalhesContrato: servicos (contrato ' + idBuscado + '): ' + e.message);
    }

    try {
      contrato.produtos = ReadContractsProdutos()
        .filter(function (l) { return Number(l[contractsProdutosIdContratoCol]) === idBuscado && !l[contractsProdutosDataExclusaoCol]; })
        .map(function (l) { return { nome: String(l[contractsProdutosNomeCol] || '') }; });
    } catch (e) {
      console.error('buscarDetalhesContrato: produtos (contrato ' + idBuscado + '): ' + e.message);
    }

    try {
      contrato.checklist = ReadContractsChecklist()
        .filter(function (l) { return Number(l[contractsChecklistIdContratoCol]) === idBuscado && !l[contractsChecklistDataExclusaoCol]; })
        .map(function (l) {
          const item = lerItemChecklistContrato(l);
          return { descricao: String(item.descricao || ''), periodo: String(item.periodo || '') };
        });
    } catch (e) {
      console.error('buscarDetalhesContrato: checklist (contrato ' + idBuscado + '): ' + e.message);
    }

    try {
      contrato.sla = lerSlaContrato(idBuscado).map(function (s) {
        return {
          prioridade: String(s.prioridade || ''),
          prazoAtendimento: (s.prazoAtendimento === '' || isNaN(Number(s.prazoAtendimento))) ? '' : Number(s.prazoAtendimento),
          prazoSolucao: (s.prazoSolucao === '' || isNaN(Number(s.prazoSolucao))) ? '' : Number(s.prazoSolucao),
          horasUteis: !!s.horasUteis
        };
      });
    } catch (e) {
      console.error('buscarDetalhesContrato: sla (contrato ' + idBuscado + '): ' + e.message);
    }

    // Autoteste de serialização -- se algo aqui não for serializável, a
    // gente descobre AGORA (com log e contrato que falhou), em vez do
    // front-end receber silenciosamente um valor vazio/nulo sem explicação.
    try {
      JSON.parse(JSON.stringify(contrato));
    } catch (eSerializacao) {
      console.error('buscarDetalhesContrato: contrato ' + idBuscado + ' montado, mas não é serializável: ' + eSerializacao.message);
      return { sucesso: false, mensagem: 'Erro ao preparar os dados do contrato pra exibição: ' + eSerializacao.message };
    }

    return { sucesso: true, contrato: contrato };
  } catch (e) {
    console.error('buscarDetalhesContrato: erro geral (ID ' + idInput + '): ' + e.message);
    return { sucesso: false, mensagem: 'Erro no servidor: ' + e.message };
  }
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
