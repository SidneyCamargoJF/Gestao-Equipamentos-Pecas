// Tabela de anexos do Contrato -- mesmo layout de 8 colunas de
// tbl_chamado_anexos (ID, ID_CONTRATO, TIPO, NOME_ARQUIVO, URL, HASH,
// DATA_UPLOAD, DATA_EXCLUSAO). Precisa existir na planilha antes de testar.
const contratoAnexosTableName = 'tbl_contratos_anexos';
const firstLineContratoAnexos = 3;
const numColumnsContratoAnexos = 8;

/**
 * Wrapper fininho sobre adicionarAnexoGenerico (apps/Helper/back/AnexosBackend.js)
 * -- mesma lógica de upload/duplicidade que o Chamados usa, só muda a tabela.
 */
function adicionarAnexoContrato(contratoId, tipo, arquivo) {
  return adicionarAnexoGenerico({
    tabelaAnexos: contratoAnexosTableName,
    idRegistro: contratoId,
    tipo: tipo,
    arquivo: arquivo,
    firstLine: firstLineContratoAnexos,
    numColumns: numColumnsContratoAnexos
  });
}

function buscarAnexosContrato(contratoId) {
  return buscarAnexosGenerico(contratoAnexosTableName, contratoId, firstLineContratoAnexos, numColumnsContratoAnexos);
}

function excluirAnexoContrato(anexoId) {
  return excluirAnexoGenerico(contratoAnexosTableName, anexoId, firstLineContratoAnexos, numColumnsContratoAnexos);
}

// Busca um contrato completo (campos principais + as 4 listas vinculadas)
// pra preencher o formulário de edição.
function buscarContratoParaEdicao(idInput) {
  try {
    const idBuscado = Number(idInput);
    const linha = ReadContracts().find(function (l) { return Number(l[contractIdCol]) === idBuscado; });
    if (!linha) return null;

    const equipamentosTodos = ReadEquipments();
    const equipamentos = ReadContractsEquipaments()
      .filter(function (l) {
        return Number(l[contractsEquipamentsIdContratoCol]) === idBuscado && !l[contractsEquipamentsDataExclusaoCol];
      })
      .map(function (l) {
        const idEquip = Number(l[contractEquipamentsIdEquipamentCol]);
        const equip = equipamentosTodos.find(function (e) { return Number(e[0]) === idEquip; });
        if (!equip) return null;
        return {
          equipamento: equip[1] || '',
          marca: equip[2] || '',
          capacidade: equip[3] || '',
          modelo: equip[4] || '',
          patrimonio: equip[5] || '',
          localizacao: equip[7] || ''
        };
      })
      .filter(function (e) { return e !== null; });

    const servicos = ReadContractsServicos()
      .filter(function (l) {
        return Number(l[contractsServicosIdContratoCol]) === idBuscado && !l[contractsServicosDataExclusaoCol];
      })
      .map(function (l) {
        return { servico: l[contractsServicosNomeCol], periodicidade: l[contractsServicosPeriodicidadeCol] };
      });

    const produtos = ReadContractsProdutos()
      .filter(function (l) {
        return Number(l[contractsProdutosIdContratoCol]) === idBuscado && !l[contractsProdutosDataExclusaoCol];
      })
      .map(function (l) { return { nome: l[contractsProdutosNomeCol] }; });

    const checklist = ReadContractsChecklist()
      .filter(function (l) {
        return Number(l[contractsChecklistIdContratoCol]) === idBuscado && !l[contractsChecklistDataExclusaoCol];
      })
      .map(function (l) { return { descricao: l[contractsChecklistNomeCol] }; });

    return {
      id: linha[contractIdCol],
      numero: linha[contractNumberCol],
      contrato: linha[contratctNameCol],
      // Datas convertidas pra "yyyy-MM-dd" (converterParaInputDate, de
      // apps/Pecas/back/CadastroPeca.js) -- <input type="date"> exige esse
      // formato, e se a célula vier como objeto Date cru, o google.script.run
      // falha silenciosamente (sem erro nenhum) ao tentar devolver o valor.
      dataEncerramento: converterParaInputDate(linha[contractDataEncerramento]),
      sei: linha[contractSEICol],
      dataFechamento: converterParaInputDate(linha[contractDataFechamentoCol]),
      empresa: linha[contractEmpresaCol],
      objeto: linha[contractObjetoCol],
      observacoes: linha[contractObservacoesCol],
      valor: linha[contractValorCol],
      dataInicial: converterParaInputDate(linha[contractDataInicialCol]),
      dataFinal: converterParaInputDate(linha[contractDataFinalCol]),
      contatoEmpresa: linha[contractContatoEmpresaCol],
      telefone: linha[contractTelefoneCol],
      email: linha[contractEmailCol],
      gestor: linha[contractGestorCol],
      situacao: linha[contractSituacaoCol],
      equipamentos: equipamentos,
      servicos: servicos,
      produtos: produtos,
      checklist: checklist
    };
  } catch (e) {
    console.error('Erro em buscarContratoParaEdicao: ' + e.message);
    return null;
  }
}

// Próximo ID + próxima linha livre de uma tabela relacional do contrato
// (mesmo cálculo que salvarContratoBackend já faz pra tbl_contratos, só
// que genérico pra reaproveitar nas 4 tabelas de vínculo abaixo).
function proximoIdTabela(aba, firstLine) {
  const ultimaLinha = Math.max(aba.getLastRow(), firstLine - 1);
  let idAtual = (ultimaLinha >= firstLine) ? aba.getRange(ultimaLinha, 1).getValue() : 0;
  if (idAtual === '' || isNaN(Number(idAtual))) idAtual = 0;
  return { novoId: Number(idAtual) + 1, proximaLinha: ultimaLinha + 1 };
}

// Equipamentos vêm do formulário só com o patrimônio -- resolve o ID real
// do equipamento (buscarEquipamentoIdPorPatrimonio, de
// apps/Helper/back/EquipamentoBuscaBackend.js) antes de gravar o vínculo.
function salvarEquipamentosContrato(contratoId, lista) {
  const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(contractsEquipamentsTableName);
  if (!aba) return;
  const dataAtual = Utilities.formatDate(new Date(), 'GMT-3', 'dd/MM/yyyy');

  (lista || []).forEach(function (item) {
    const idEquipamento = buscarEquipamentoIdPorPatrimonio(item.patrimonio);
    if (!idEquipamento) return;

    const pos = proximoIdTabela(aba, firstLineContractsEquipaments);
    const linha = [pos.novoId, contratoId, idEquipamento, dataAtual, ''];
    aba.getRange(pos.proximaLinha, 1, 1, numColumnsContractsEquipaments).setValues([linha]);
  });
}

function salvarServicosContrato(contratoId, lista) {
  const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(contractsServicosTableName);
  if (!aba) return;
  const dataAtual = Utilities.formatDate(new Date(), 'GMT-3', 'dd/MM/yyyy');

  (lista || []).forEach(function (item) {
    const pos = proximoIdTabela(aba, firstLineContractsServicos);
    // ordem das colunas: Id, IdContrato, Nome, Periodicidade, DataCadastro, DataExclusao, DataAlteracao
    const linha = [pos.novoId, contratoId, item.servico, item.periodicidade || '', dataAtual, '', ''];
    aba.getRange(pos.proximaLinha, 1, 1, numColumnsContractsServicos).setValues([linha]);
  });
}

function salvarProdutosContrato(contratoId, lista) {
  const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(contractsProdutosTableName);
  if (!aba) return;
  const dataAtual = Utilities.formatDate(new Date(), 'GMT-3', 'dd/MM/yyyy');

  (lista || []).forEach(function (item) {
    const pos = proximoIdTabela(aba, firstLineContractsProdutos);
    const linha = [pos.novoId, contratoId, item.nome, dataAtual, ''];
    aba.getRange(pos.proximaLinha, 1, 1, numColumnsContractsProdutos).setValues([linha]);
  });
}

function salvarChecklistContrato(contratoId, lista) {
  const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(contractsChecklistTableName);
  if (!aba) return;
  const dataAtual = Utilities.formatDate(new Date(), 'GMT-3', 'dd/MM/yyyy');

  (lista || []).forEach(function (item) {
    const pos = proximoIdTabela(aba, firstLineContractsChecklist);
    // ordem das colunas: Id, IdContrato, Nome, DataCadastro, DataExclusao, DataAlteracao
    const linha = [pos.novoId, contratoId, item.descricao, dataAtual, '', ''];
    aba.getRange(pos.proximaLinha, 1, 1, numColumnsContractsChecklist).setValues([linha]);
  });
}

function salvarContratoBackend (dados) {
  try {
    if (!dados) {
      return { sucesso: false, mensagem: 'Dados do contrato não informados.' };
    }

    const camposObrigatorios = [
      { campo: 'numero', rotulo: 'Número' }, { campo: 'contrato', rotulo: 'Nome do Contrato' },
      { campo: 'empresa', rotulo: 'Empresa' }, { campo: 'sei', rotulo:'Documento SEI'},
      { campo: 'dataFechamento', rotulo:'Data do fechamento do contrato'}, { campo: 'situacao', rotulo:'Situação'},
      { campo: 'objeto', rotulo: 'Objeto do Contrato'}, { campo: 'dataInicial', rotulo: 'Data Inicial'},
      { campo: 'dataFinal', rotulo: 'Data Final'}, { campo: 'telefone', rotulo: 'Telefone'},
      { campo: 'email', rotulo:'E-mail'}, { campo: 'gestor', rotulo:'Gestor do Contrato'}
    ]

    for(let i = 0; i < camposObrigatorios.length; i++) {
      const item = camposObrigatorios[i]
      if (!String(dados[item.campo] || '').trim()) {
        return { sucesso: false, mensagem: 'Preencha o campo ' + item.rotulo + '.' }
      }
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const abaContratos = ss.getSheetByName(contractTableName);
    if (!abaContratos) {
      return { sucesso: false, mensagem: "Aba 'tbl_contratos' não foi encontrada na planilha." };
    }

    const dataAtual = Utilities.formatDate(new Date(), 'GMT-3', 'dd/MM/yyyy');
    const idEdicao = dados.id ? Number(dados.id) : null;

    // ===== MODO EDIÇÃO =====
    if (idEdicao) {
      const todasLinhas = ReadContracts();
      const idx = todasLinhas.findIndex(l => Number(l[0]) === idEdicao);
      if (idx === -1) {
        return { sucesso: false, mensagem: 'Contrato não encontrado para edição (ID ' + idEdicao + ').' };
      }

      const linhaReal = idx + firstLineContracts;
      // cópia do conteúdo da linha atual -- active e dataExclusao são
      // preservados como estavam (editar um contrato não deve reativar um
      // que foi desativado, nem o contrário)
      const linhaAtual = todasLinhas[idx];

      const linhaAtualizada = [
        idEdicao,
        dados.numero,
        dados.contrato,
        dados.dataEncerramento || '',
        dados.sei,
        dados.dataFechamento,
        dados.empresa,
        dados.objeto,
        dados.observacoes || '',
        dados.valor || '',
        dados.dataInicial,
        dados.dataFinal,
        dados.contatoEmpresa || '',
        dados.telefone,
        dados.email,
        dados.gestor || '',
        linhaAtual[contractActiveCol],
        dados.situacao,
        dataAtual,
        linhaAtual[contractDataExclusaoCol]
      ];

      abaContratos.getRange(linhaReal, 1, 1, numColumnsContracts).setValues([linhaAtualizada]);

      const respostasAnexos = (dados.anexos || []).map(arquivo => adicionarAnexoContrato(idEdicao, 'Documento', arquivo));
      const existeAnexoDuplicado = respostasAnexos.some(r => r && r.duplicado);

      salvarEquipamentosContrato(idEdicao, dados.equipamentos);
      salvarServicosContrato(idEdicao, dados.servicos);
      salvarProdutosContrato(idEdicao, dados.produtos);
      salvarChecklistContrato(idEdicao, dados.checklist);

      return {
        sucesso: true,
        mensagem: 'Contrato atualizado com sucesso!',
        id: idEdicao,
        duplicado: existeAnexoDuplicado
      };
    }

    // ===== MODO CRIAÇÃO =====
    const ultimaLinhaPlanilha = abaContratos.getLastRow();
    const ultimaLinha = Math.max(ultimaLinhaPlanilha, firstLineContracts - 1);

    let novoId;
    if (ultimaLinha < firstLineContracts) {
      novoId = 1;
    } else {
      let idAtual = abaContratos.getRange(ultimaLinha, 1).getValue();
      if (idAtual === '' || isNaN(Number(idAtual))) idAtual = 0;
      novoId = Number(idAtual) + 1;
    }

    // Ordem: ID, NUMERO, CONTRATO_NOME, DATA_FECHAMENTO, SEI, DATA_FECHAMENTO,
    // EMPRESA, OBJETO, OBSERVAÇÕES, VALOR, DATA_INICIAL, DATA_FINAL, CONTATO_EMPRESA
    // TELEFONE, EMAIL, GESTOR, ACTIVE, SITUACAO, DATA_ALTERACAO E DATA_EXCLUSAO
    const novaLinha = [
      novoId,
      dados.numero,
      dados.contrato,
      dados.dataEncerramento || '',
      dados.sei,
      dados.dataFechamento,
      dados.empresa,
      dados.objeto,
      dados.observacoes || '',
      dados.valor || '',
      dados.dataInicial,
      dados.dataFinal,
      dados.contatoEmpresa || '',
      dados.telefone,
      dados.email,
      dados.gestor || '',
      'Y',
      dados.situacao,
      '',
      ''
    ];

    abaContratos.getRange(ultimaLinha + 1, 1, 1, numColumnsContracts).setValues([novaLinha]);

    const respostasAnexos = (dados.anexos || []).map(arquivo => adicionarAnexoContrato(novoId, 'Documento', arquivo));
    const existeAnexoDuplicado = respostasAnexos.some(r => r && r.duplicado);

    salvarEquipamentosContrato(novoId, dados.equipamentos);
    salvarServicosContrato(novoId, dados.servicos);
    salvarProdutosContrato(novoId, dados.produtos);
    salvarChecklistContrato(novoId, dados.checklist);

    return {
      sucesso: true,
      mensagem: 'Contrato criado com sucesso.',
      id: novoId,
      duplicado: existeAnexoDuplicado
    };

  } catch (e) {
    return { sucesso: false, mensagem: 'Erro no servidor: ' + e.message };
  }
}