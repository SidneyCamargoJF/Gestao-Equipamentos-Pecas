const contratoAnexosTableName = 'tbl_contratos_anexos';
const firstLineContratoAnexos = 3;
const numColumnsContratoAnexos = 8;

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

function buscarFornecedoresParaEmpresa() {
  return ReadSuppliers()
    .filter(function (l) {
      return l[0] && String(l[21] || '').trim().toLowerCase() !== 'inativo';
    })
    .map(function (l) {
      return {
        nome: l[3] || l[4] || '',
        telefone: l[9] || l[10] || '',
        email: l[8] || ''
      };
    })
    .filter(function (f) { return f.nome; });
}

// Busca um contrato completo
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
        return {
          tipoManutencao: l[contractsServicosTipoManutencaoCol] || '',
          categoria: l[contractsServicosCategoriaCol] || '',
          tipo: l[contractsServicosTipoCol] || '',
          capacidade: l[contractsServicosCapacidadeCol] || '',
          periodicidade: l[contractsServicosPeriodicidadeCol] || ''
        };
      });

    const produtos = ReadContractsProdutos()
      .filter(function (l) {
        return Number(l[contractsProdutosIdContratoCol]) === idBuscado && !l[contractsProdutosDataExclusaoCol];
      })
      .map(function (l) { return { nome: l[contractsProdutosNomeCol] }; });

    // PERIODICIDADE em coluna própria; linhas antigas com prefixo
    // "[Mensal] "/"[Anual] " no texto ainda são lidas (plano B).
    const checklist = ReadContractsChecklist()
      .filter(function (l) {
        return Number(l[contractsChecklistIdContratoCol]) === idBuscado && !l[contractsChecklistDataExclusaoCol];
      })
      .map(function (l) {
        const item = lerItemChecklistContrato(l);
        return { descricao: item.descricao, periodo: item.periodo };
      });

    return {
      id: linha[contractIdCol],
      numero: linha[contractNumberCol],
      contrato: linha[contractNameCol],
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
      dataBasePreventiva: converterParaInputDate(linha[contractDataBasePreventivaCol]),
      equipamentos: equipamentos,
      servicos: servicos,
      produtos: produtos,
      checklist: checklist,
      sla: lerSlaContrato(idBuscado)
    };
  } catch (e) {
    console.error('Erro em buscarContratoParaEdicao: ' + e.message);
    return null;
  }
}

function proximoIdTabela(aba, firstLine) {
  const ultimaLinha = Math.max(aba.getLastRow(), firstLine - 1);
  let idAtual = (ultimaLinha >= firstLine) ? aba.getRange(ultimaLinha, 1).getValue() : 0;
  if (idAtual === '' || isNaN(Number(idAtual))) idAtual = 0;
  return { novoId: Number(idAtual) + 1, proximaLinha: ultimaLinha + 1 };
}

// Marca como excluídas (DataExclusao = hoje) todas as linhas ativas desse
// contrato numa tabela filha -- chamado antes de reinserir a lista inteira
// em cada salvar*Contrato. Sem isso, toda vez que um contrato existente é
// editado e salvo de novo, a lista completa (equipamentos/serviços/
// produtos/checklist) era inserida por cima da anterior sem nunca excluir
// a de antes, duplicando tudo a cada edição salva.
function excluirAnterioresContrato(aba, leitura, firstLine, idContratoCol, dataExclusaoCol, contratoId, dataAtual) {
  leitura.forEach(function (linha, idx) {
    if (Number(linha[idContratoCol]) === Number(contratoId) && !linha[dataExclusaoCol]) {
      aba.getRange(idx + firstLine, dataExclusaoCol + 1).setValue(dataAtual);
    }
  });
}

function salvarEquipamentosContrato(contratoId, lista) {
  const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(contractsEquipamentsTableName);
  if (!aba) return;
  const dataAtual = Utilities.formatDate(new Date(), 'GMT-3', 'dd/MM/yyyy');

  excluirAnterioresContrato(aba, ReadContractsEquipaments(), firstLineContractsEquipaments,
    contractsEquipamentsIdContratoCol, contractsEquipamentsDataExclusaoCol, contratoId, dataAtual);

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

  excluirAnterioresContrato(aba, ReadContractsServicos(), firstLineContractsServicos,
    contractsServicosIdContratoCol, contractsServicosDataExclusaoCol, contratoId, dataAtual);

  (lista || []).forEach(function (item) {
    const pos = proximoIdTabela(aba, firstLineContractsServicos);
    // ordem das colunas: Id, IdContrato, TipoManutencao, Categoria, Tipo, Capacidade, Periodicidade, DataCadastro, DataExclusao, DataAlteracao
    const linha = [pos.novoId, contratoId, item.tipoManutencao || '', item.categoria || '', item.tipo || '', item.capacidade || '', item.periodicidade || '', dataAtual, '', ''];
    aba.getRange(pos.proximaLinha, 1, 1, numColumnsContractsServicos).setValues([linha]);
  });
}

function salvarProdutosContrato(contratoId, lista) {
  const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(contractsProdutosTableName);
  if (!aba) return;
  const dataAtual = Utilities.formatDate(new Date(), 'GMT-3', 'dd/MM/yyyy');

  excluirAnterioresContrato(aba, ReadContractsProdutos(), firstLineContractsProdutos,
    contractsProdutosIdContratoCol, contractsProdutosDataExclusaoCol, contratoId, dataAtual);

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

  excluirAnterioresContrato(aba, ReadContractsChecklist(), firstLineContractsChecklist,
    contractsChecklistIdContratoCol, contractsChecklistDataExclusaoCol, contratoId, dataAtual);

  (lista || []).forEach(function (item) {
    const pos = proximoIdTabela(aba, firstLineContractsChecklist);
    // Periodicidade gravada na coluna PERIODICIDADE (G), sem prefixo no texto.
    const periodo = normalizarPeriodicidade(item.periodo) || 'mensal';
    // ordem das colunas: Id, IdContrato, Nome, DataCadastro, DataExclusao, DataAlteracao, Periodicidade, ContratoServicoId
    const linha = [pos.novoId, contratoId, String(item.descricao || '').trim(), dataAtual, '', '', periodo, ''];
    aba.getRange(pos.proximaLinha, 1, 1, numColumnsContractsChecklist).setValues([linha]);
  });
}

// ===== SLA (tbl_contratos_sla) =====
// Lista do SLA ativo do contrato, uma entrada por prioridade, na ordem de
// PRIORIDADES_CHAMADO. Horas vêm como número (ou '' se não informadas).
function lerSlaContrato(contratoId, linhasSla) {
  const idBuscado = Number(contratoId);
  const linhas = (linhasSla || ReadContractsSla()).filter(function (l) {
    return Number(l[contractsSlaIdContratoCol]) === idBuscado && !l[contractsSlaDataExclusaoCol];
  });
  return PRIORIDADES_CHAMADO.map(function (prioridade) {
    const l = linhas.find(function (x) { return String(x[contractsSlaPrioridadeCol]).trim().toLowerCase() === prioridade; });
    return {
      prioridade: prioridade,
      prazoAtendimento: l && l[contractsSlaPrazoAtendimentoCol] !== '' ? Number(l[contractsSlaPrazoAtendimentoCol]) : '',
      prazoSolucao: l && l[contractsSlaPrazoSolucaoCol] !== '' ? Number(l[contractsSlaPrazoSolucaoCol]) : '',
      horasUteis: l ? String(l[contractsSlaHorasUteisCol]).trim().toUpperCase() === 'Y' : false
    };
  });
}

// Normaliza a lista que veio da tela: só prioridades conhecidas, horas
// numéricas >= 0. Lança erro com mensagem amigável se algo vier inválido.
function normalizarSlaContrato_(lista) {
  const horas = function (v, rotulo) {
    if (v === '' || v === null || v === undefined) return '';
    const n = Number(String(v).replace(',', '.'));
    if (isNaN(n) || n < 0) throw new Error('SLA: ' + rotulo + ' precisa ser um número de horas maior ou igual a zero.');
    return n;
  };
  return (lista || [])
    .filter(function (item) { return PRIORIDADES_CHAMADO.indexOf(String(item.prioridade || '').toLowerCase()) !== -1; })
    .map(function (item) {
      const p = String(item.prioridade).toLowerCase();
      return {
        prioridade: p,
        prazoAtendimento: horas(item.prazoAtendimento, 'prazo de atendimento (' + p + ')'),
        prazoSolucao: horas(item.prazoSolucao, 'prazo de solução (' + p + ')'),
        horasUteis: !!item.horasUteis
      };
    })
    // prioridade sem nenhum prazo informado não vira linha
    .filter(function (item) { return item.prazoAtendimento !== '' || item.prazoSolucao !== ''; });
}

// Mesmo padrão de salvarServicosContrato: marca as linhas ativas do
// contrato como excluídas e reinsere a lista inteira (em lote).
function salvarSlaContrato(contratoId, listaNormalizada) {
  const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(contractsSlaTableName);
  if (!aba) return;
  const dataAtual = Utilities.formatDate(new Date(), 'GMT-3', 'dd/MM/yyyy');

  excluirAnterioresContrato(aba, ReadContractsSla(), firstLineContractsSla,
    contractsSlaIdContratoCol, contractsSlaDataExclusaoCol, contratoId, dataAtual);

  if (!listaNormalizada.length) return;
  const pos = proximoIdTabela(aba, firstLineContractsSla);
  // ordem das colunas: ID, CONTRATO_ID, PRIORIDADE, PRAZO_ATENDIMENTO_HORAS,
  // PRAZO_SOLUCAO_HORAS, HORAS_UTEIS, DATA_CADASTRO, DATA_ALTERACAO, DATA_EXCLUSAO
  const linhas = listaNormalizada.map(function (item, i) {
    return [pos.novoId + i, contratoId, item.prioridade, item.prazoAtendimento, item.prazoSolucao,
      item.horasUteis ? 'Y' : 'N', dataAtual, '', ''];
  });
  aba.getRange(pos.proximaLinha, 1, linhas.length, numColumnsContractsSla).setValues(linhas);
}

function salvarContratoBackend (dados) {
  try {
    return executarComLock(function () { return salvarContratoBackend_(dados); });
  } catch (e) {
    return { sucesso: false, mensagem: 'Erro no servidor: ' + e.message };
  }
}

function salvarContratoBackend_ (dados) {
  try {
    if (!dados) {
      return { sucesso: false, mensagem: 'Dados do contrato não informados.' };
    }

    const camposObrigatorios = [
      { campo: 'numero', rotulo: 'Número' }, { campo: 'contrato', rotulo: 'Nome do Contrato' },
      { campo: 'empresa', rotulo: 'Empresa' }, { campo: 'sei', rotulo:'Documento SEI'},
      { campo: 'dataFechamento', rotulo:'Data do fechamento do contrato'},
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

    if (!(dados.servicos || []).length) {
      return { sucesso: false, mensagem: 'Especifique pelo menos um serviço antes de salvar o contrato.' };
    }
    if (!(dados.equipamentos || []).length) {
      return { sucesso: false, mensagem: 'Vincule pelo menos um equipamento (por patrimônio) antes de salvar o contrato.' };
    }

    let slaNormalizado;
    try {
      slaNormalizado = normalizarSlaContrato_(dados.sla);
    } catch (erroSla) {
      return { sucesso: false, mensagem: erroSla.message };
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
      // cópia do conteúdo da linha atual
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
        '', // Situação não é mais escolhida na tela -- é calculada na Consulta (data final/encerramento)
        dataAtual,
        linhaAtual[contractDataExclusaoCol],
        dados.dataBasePreventiva || dados.dataInicial
      ];

      abaContratos.getRange(linhaReal, 1, 1, numColumnsContracts).setValues([linhaAtualizada]);

      const respostasAnexos = (dados.anexos || []).map(arquivo => adicionarAnexoContrato(idEdicao, 'Documento', arquivo));
      const existeAnexoDuplicado = respostasAnexos.some(r => r && r.duplicado);

      salvarEquipamentosContrato(idEdicao, dados.equipamentos);
      salvarServicosContrato(idEdicao, dados.servicos);
      salvarProdutosContrato(idEdicao, dados.produtos);
      salvarChecklistContrato(idEdicao, dados.checklist);
      salvarSlaContrato(idEdicao, slaNormalizado);

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
      '', // Situação não é mais escolhida na tela -- é calculada na Consulta (data final/encerramento)
      '',
      '',
      dados.dataBasePreventiva || dados.dataInicial
    ];

    abaContratos.getRange(ultimaLinha + 1, 1, 1, numColumnsContracts).setValues([novaLinha]);

    const respostasAnexos = (dados.anexos || []).map(arquivo => adicionarAnexoContrato(novoId, 'Documento', arquivo));
    const existeAnexoDuplicado = respostasAnexos.some(r => r && r.duplicado);

    salvarEquipamentosContrato(novoId, dados.equipamentos);
    salvarServicosContrato(novoId, dados.servicos);
    salvarProdutosContrato(novoId, dados.produtos);
    salvarChecklistContrato(novoId, dados.checklist);
    salvarSlaContrato(novoId, slaNormalizado);

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