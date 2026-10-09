// Tabela de anexos do Contrato -- mesmo layout de 8 colunas de
// tbl_chamado_anexos (ID, ID_CONTRATO, TIPO, NOME_ARQUIVO, URL, HASH,
// DATA_UPLOAD, DATA_EXCLUSAO). Precisa existir na planilha antes de testar.
const contratoAnexosTableName = 'tbl_contrato_anexos';
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
        dados.empresaSearch,
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
        dataAtual,
        linhaAtual[contractDataExclusaoCol]
      ];

      abaContratos.getRange(linhaReal, 1, 1, numColumnsContracts).setValues([linhaAtualizada]);

      const respostasAnexos = (dados.anexos || []).map(arquivo => adicionarAnexoContrato(idEdicao, 'Documento', arquivo));
      const existeAnexoDuplicado = respostasAnexos.some(r => r && r.duplicado);

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
    // TELEFONE, EMAIL, GESTOR, ACTIVE, DATA_ALTERACAO E DATA_EXCLUSAO
    const novaLinha = [
      novoId,
      dados.numero,
      dados.contrato,
      dados.dataEncerramento || '',
      dados.sei,
      dados.dataFechamento,
      dados.empresaSearch,
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
      '',
      ''
    ];

    abaContratos.getRange(ultimaLinha + 1, 1, 1, numColumnsContracts).setValues([novaLinha]);

    const respostasAnexos = (dados.anexos || []).map(arquivo => adicionarAnexoContrato(novoId, 'Documento', arquivo));
    const existeAnexoDuplicado = respostasAnexos.some(r => r && r.duplicado);

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