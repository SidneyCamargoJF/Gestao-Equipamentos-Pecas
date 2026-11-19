// =====================================================
// MIGRAÇÃO - colunas novas de tbl_chamados (CONTRATO_ID em diante)
// Chamados abertos antes da Etapa 3 têm essas colunas vazias. Rodar uma
// vez pelo editor do Apps Script: preencherCamposNovosChamados()
// Só preenche o que está vazio -- nada já gravado é sobrescrito, e pode
// ser rodada de novo sem efeito colateral.
// =====================================================

/**
 * Para cada chamado:
 * - ORIGEM vazia -> 'manual' (as automáticas sempre gravaram 'automatica');
 * - sem CONTRATO_ID e com equipamento -> contrato vigente na DATA_ABERTURA
 *   que cobre o equipamento; grava CONTRATO_ID, FORNECEDOR_ID, ATRIBUÍDO A
 *   (se vazio) e os prazos de SLA contados da DATA_ABERTURA (00:00, pois a
 *   abertura só guarda o dia; em horas úteis a contagem começa às 08h).
 * Grava em bloco (colunas 8 e 14 a 20) e registra no histórico de cada
 * chamado vinculado.
 */
function preencherCamposNovosChamados() {
  return executarComLock(function () { return preencherCamposNovosChamados_(); }, 60000);
}

function preencherCamposNovosChamados_() {
  const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ticketsTableName);
  if (!aba) return { sucesso: false, mensagem: "Aba '" + ticketsTableName + "' não encontrada." };

  const linhas = ReadTickets();
  if (!linhas.length) return { sucesso: true, mensagem: 'Nenhum chamado na planilha.', origem: 0, vinculados: 0 };

  const cache = carregarCacheContratos_();
  const c = function (linha, col) { return linha[col - 1]; };
  let qtdOrigem = 0;
  const historico = [];

  const atribuidos = [];
  const blocoNovo = linhas.map(function (l) {
    let atribuido = c(l, ticketsAtribuidoCol);
    let contratoId = c(l, ticketsContratoIdCol);
    let origem = c(l, ticketsOrigemCol);
    let prazoAtend = c(l, ticketsPrazoAtendimentoCol);
    let prazoSol = c(l, ticketsPrazoSolucaoCol);
    let fornecedorId = c(l, ticketsFornecedorIdCol);

    if (c(l, ticketsIdCol) !== '' && !String(origem || '').trim()) {
      origem = 'manual';
      qtdOrigem++;
    }

    const abertura = parseDataFlex(c(l, ticketsDtAberturaCol));
    if (c(l, ticketsIdCol) !== '' && !contratoId && c(l, ticketsEquipamentoIdCol) && abertura) {
      const vigente = buscarContratoVigentePorEquipamento(c(l, ticketsEquipamentoIdCol), abertura, cache);
      if (vigente) {
        const ct = vigente.contrato;
        contratoId = ct.id;
        fornecedorId = fornecedorId || ct.fornecedorId || '';
        if (!String(atribuido || '').trim()) atribuido = ct.empresa;
        if (!prazoAtend && !prazoSol) {
          const prazos = calcularPrazosChamado(ct.id, c(l, ticketsPriorityCol), abertura, cache.sla);
          prazoAtend = prazos.prazoAtendimento;
          prazoSol = prazos.prazoSolucao;
        }
        historico.push({
          chamadoId: c(l, ticketsIdCol),
          texto: 'Vinculado ao contrato ' + ct.numero + ' (' + ct.empresa + ') -- preenchimento retroativo'
        });
      }
    }

    atribuidos.push([atribuido === undefined || atribuido === null ? '' : atribuido]);
    // colunas 14 a 20: CONTRATO_ID, ORIGEM, COMPETENCIA, DATA_PREVISTA,
    // PRAZO_ATENDIMENTO, PRAZO_SOLUCAO, FORNECEDOR_ID
    return [
      contratoId || '',
      origem || '',
      textoLiteralPlanilha(c(l, ticketsCompetenciaCol)),
      c(l, ticketsDataPrevistaCol) || '',
      prazoAtend || '',
      prazoSol || '',
      fornecedorId || ''
    ];
  });

  if (!qtdOrigem && !historico.length) {
    return { sucesso: true, mensagem: 'Nada a preencher: os chamados já estão com as colunas novas.', origem: 0, vinculados: 0 };
  }

  aba.getRange(firstLineTickets, ticketsAtribuidoCol, atribuidos.length, 1).setValues(atribuidos);
  aba.getRange(firstLineTickets, ticketsContratoIdCol, blocoNovo.length, ticketsFornecedorIdCol - ticketsContratoIdCol + 1).setValues(blocoNovo);
  if (historico.length) adicionarHistoricoSistemaLote(historico);

  const mensagem = 'ORIGEM preenchida em ' + qtdOrigem + ' chamado(s); ' + historico.length + ' vinculado(s) a contrato.';
  console.log(mensagem);
  return { sucesso: true, mensagem: mensagem, origem: qtdOrigem, vinculados: historico.length };
}
