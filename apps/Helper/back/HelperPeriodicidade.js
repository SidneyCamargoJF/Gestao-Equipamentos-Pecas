// =====================================================
// PERIODICIDADE DOS ITENS DE CHECKLIST / SERVIÇOS
// Intervalo em meses de cada periodicidade -- usado na geração das
// preventivas (um item vence no mês M quando meses % intervalo === 0).
// =====================================================
const PERIODICIDADES = {
  mensal: 1,
  bimestral: 2,
  trimestral: 3,
  quadrimestral: 4,
  semestral: 6,
  anual: 12
};

const PERIODICIDADES_ORDEM = ['mensal', 'bimestral', 'trimestral', 'quadrimestral', 'semestral', 'anual'];

function normalizarPeriodicidade(valor) {
  const p = String(valor || '').trim().toLowerCase();
  return PERIODICIDADES.hasOwnProperty(p) ? p : '';
}

/**
 * Lê descrição e periodicidade de uma linha de tbl_contratos_Checklist.
 * Usa a coluna PERIODICIDADE; se estiver vazia (linha antiga), cai no
 * plano B: extrai o prefixo "[Mensal] "/"[Anual] " do texto.
 * Sempre devolve a descrição SEM o prefixo.
 */
function lerItemChecklistContrato(linha) {
  const bruto = String(linha[contractsChecklistNomeCol] || '').trim();
  const match = bruto.match(/^\[([^\]]+)\]\s*(.*)$/);
  const descricao = match ? match[2] : bruto;
  const periodoColuna = normalizarPeriodicidade(linha[contractsChecklistPeriodicidadeCol]);
  const periodoPrefixo = match ? normalizarPeriodicidade(match[1]) : '';
  return {
    id: linha[contractsChecklistIdCol],
    descricao: descricao,
    periodo: periodoColuna || periodoPrefixo || 'mensal',
    servicoId: linha[contractsChecklistServicoIdCol] || '',
    categoria: String(linha[contractsChecklistCategoriaCol] || '').trim(),
    tipo: String(linha[contractsChecklistTipoCol] || '').trim()
  };
}

/**
 * Rodar UMA VEZ pelo editor do Apps Script (opcional): converte as linhas
 * antigas que ainda têm o prefixo no texto -- grava PERIODICIDADE e tira
 * o prefixo da descrição. Linhas já convertidas não são alteradas.
 */
function migrarPeriodicidadeChecklist() {
  const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(contractsChecklistTableName);
  const dados = ReadSheet(contractsChecklistTableName, firstLineContractsChecklist, numColumnsContractsChecklist);
  let alteradas = 0;
  dados.forEach(function (linha, i) {
    const bruto = String(linha[contractsChecklistNomeCol] || '');
    if (!/^\[[^\]]+\]/.test(bruto) && linha[contractsChecklistPeriodicidadeCol]) return;
    const item = lerItemChecklistContrato(linha);
    const linhaReal = i + firstLineContractsChecklist;
    aba.getRange(linhaReal, contractsChecklistNomeCol + 1).setValue(item.descricao);
    aba.getRange(linhaReal, contractsChecklistPeriodicidadeCol + 1).setValue(item.periodo);
    alteradas++;
  });
  Logger.log('Linhas convertidas: ' + alteradas);
  return alteradas;
}

/**
 * Rodar UMA VEZ pelo editor do Apps Script: limpa duplicidades que já
 * existem em tbl_contratos_Checklist (itens repetidos de antes da
 * blindagem em salvarChecklistContrato -- ver CadastroContratoBackend.js).
 * Pra cada grupo (mesmo contrato + descrição + periodicidade + categoria/tipo)
 * com mais de uma linha ativa, mantém só a mais recente e marca
 * DATA_EXCLUSAO nas outras. Não altera linhas já excluídas.
 */
function migrarDuplicadosChecklistContrato() {
  const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(contractsChecklistTableName);
  const dados = ReadSheet(contractsChecklistTableName, firstLineContractsChecklist, numColumnsContractsChecklist);
  const dataAtual = Utilities.formatDate(new Date(), 'GMT-3', 'dd/MM/yyyy');

  const grupos = {};
  dados.forEach(function (linha, idx) {
    if (linha[contractsChecklistDataExclusaoCol]) return; // já excluída, ignora
    const item = lerItemChecklistContrato(linha);
    const chave = linha[contractsChecklistIdContratoCol] + '|' + item.descricao.trim().toLowerCase() + '|' + item.periodo +
      '|' + item.categoria.toLowerCase() + '|' + item.tipo.toLowerCase();
    if (!grupos[chave]) grupos[chave] = [];
    grupos[chave].push(idx);
  });

  let linhasExcluidas = 0;
  Object.keys(grupos).forEach(function (chave) {
    const idxs = grupos[chave];
    if (idxs.length <= 1) return;
    // mantém a última linha do grupo (a mais recente), exclui as anteriores
    idxs.slice(0, -1).forEach(function (idx) {
      const linhaReal = idx + firstLineContractsChecklist;
      aba.getRange(linhaReal, contractsChecklistDataExclusaoCol + 1).setValue(dataAtual);
      linhasExcluidas++;
    });
  });

  Logger.log('Duplicidades removidas: ' + linhasExcluidas);
  return { sucesso: true, linhasExcluidas: linhasExcluidas };
}
