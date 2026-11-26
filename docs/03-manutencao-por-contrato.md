# 03 — Manutenção por contrato

Regras de negócio que ligam contratos, chamados e OS preventivas.

## 1. Contrato vigente de um equipamento

Usado na abertura de corretivas. A função é `buscarContratoVigentePorEquipamento` em [ChamadoContratoBackend.js](../apps/Controller/Chamados/back/ChamadoContratoBackend.js).

Um contrato cobre o equipamento na data D quando atende a todas as condições:

1. o equipamento está em `tbl_contratos_equipamentos` para esse contrato, num vínculo sem data de exclusão;
2. o contrato está ativo (`ACTIVE = Y`) e não tem data de encerramento;
3. D está entre a data inicial e a data final do contrato.

Se mais de um contrato cobrir o equipamento, vale o de **data final mais próxima**, e a mensagem de retorno avisa que havia outros.

Ao vincular o chamado ao contrato, o sistema preenche:

| Campo do chamado | Valor |
|---|---|
| `CONTRATO_ID` | ID do contrato |
| `FORNECEDOR_ID` | Fornecedor cuja razão social ou nome fantasia é igual ao campo Empresa do contrato. Fica vazio se não encontrar |
| `ATRIBUIDO_A` | Empresa do contrato, se o campo veio vazio |
| `PRAZO_ATENDIMENTO`, `PRAZO_SOLUCAO` | Calculados pelo SLA (seção 2) |

Na **edição** de um chamado, o vínculo e os prazos já gravados não mudam. O sistema só preenche o que ainda estiver vazio.

## 2. SLA

Configurado na aba ⏱️ SLA do contrato e gravado em `tbl_contratos_sla`. Cada contrato tem uma linha por prioridade:

| Campo | Significado |
|---|---|
| Prazo de atendimento (h) | Tempo até o início do atendimento (status "Em Andamento") |
| Prazo de solução (h) | Tempo até a conclusão |
| Horas úteis | `Y`: conta só seg–sex das 08h às 18h; `N`: horas corridas |

**Cálculo:** os prazos são a abertura do chamado somada às horas do SLA da prioridade do chamado. A função é `somarHorasPrazo` em [HelperDate.js](../apps/Helper/back/HelperDate.js).

**Horas úteis:**
- Se a abertura cair fora do expediente, a contagem começa no próximo início de expediente.
- O expediente é definido em `EXPEDIENTE_INICIO_HORA` e `EXPEDIENTE_FIM_HORA`.
- Feriados não são considerados.

Se o contrato não define o prazo daquela prioridade, o campo fica vazio e esse prazo não é controlado.

Exemplo: prioridade alta com SLA de 24h úteis e abertura na quinta às 14h. As horas contam até 18h de quinta (4h), sexta inteira (10h) e segunda até 18h (10h). O prazo de solução fica em segunda às 18h.

## 3. OS preventivas automáticas

A função é `gerarPreventivasDoMes(competencia)` em [PreventivasBackend.js](../apps/Controller/Chamados/back/PreventivasBackend.js). Um gatilho diário roda essa função às 06h; ela também pode ser chamada pelo botão da Consulta de Chamados.

**Elegibilidade:** para a competência `AAAA-MM` (por padrão, o mês atual), cada contrato precisa:

1. estar ativo, sem encerramento e vigente em pelo menos um dia do mês;
2. ter ao menos um serviço não excluído com tipo de manutenção **Preventiva**;
3. ter itens de checklist devidos no mês (regra abaixo);
4. ainda não ter OS automática para o mesmo contrato e a mesma competência. Isso torna a função **idempotente**: o gatilho pode rodar todo dia sem duplicar.

**Itens devidos no mês:**

```
m = meses entre a DATA BASE PREVENTIVA (ou data inicial) e a competência
item é devido se m >= 0 e m % intervalo(periodicidade) == 0
```

| Periodicidade | Intervalo (meses) |
|---|---|
| mensal | 1 |
| bimestral | 2 |
| trimestral | 3 |
| quadrimestral | 4 |
| semestral | 6 |
| anual | 12 |

Exemplo com data base em 01/2026: em 01/2026 vencem os itens mensais, trimestrais e anuais; em 02/2026 só os mensais; em 04/2026 os mensais e os trimestrais.

Itens antigos sem a coluna de periodicidade são lidos pelo prefixo da descrição (`[Anual] Trocar capacitor`). Se não houver nada, valem como **mensal**. A migração que grava a coluna é `migrarPeriodicidadeChecklist()`.

**O que é criado:**
- **Uma OS por contrato**, com:
  - tipo `preventiva`, origem `automatica` e prioridade `media`;
  - aberta por `Sistema` e atribuída à empresa do contrato;
  - motivo `Preventiva AAAA-MM — <número do contrato>`;
  - competência e data prevista, conforme o **prazo de cada preventiva** do contrato (coluna V): `fim_mes` (padrão) = último dia do mês; `data_base` = o dia da data base no mês (limitado ao último dia do mês);
  - CONTRATO_ID e FORNECEDOR_ID.
  - Não recebe prazos de SLA: o prazo da preventiva é a data prevista.
- **Itens em `tbl_chamado_checklist`:** um para cada equipamento ativo coberto pelo contrato e cada item devido **que vale para ele**, com resultado `pendente`. O item vale para o equipamento quando a categoria (coluna I) é igual ao NOME do equipamento e o tipo (coluna J) é igual ao MODELO, sem diferenciar maiúsculas. Categoria vazia vale para todos; tipo vazio vale para todos os tipos da categoria. Equipamento sem nenhum item devido fica fora da OS.
- **Histórico:** "Preventiva gerada automaticamente".

O retorno traz `osCriadas`, `itensCriados` e `detalhes`. Os detalhes explicam por que cada contrato foi pulado: antes da data base, nenhum item devido, já gerada ou sem equipamentos ativos.

## 4. Execução do checklist

Arquivo: [ChamadoChecklistBackend.js](../apps/Controller/Chamados/back/ChamadoChecklistBackend.js).

- **Resultados possíveis:** `pendente`, `ok`, `nao_conforme` e `nao_aplicavel`.
- **Ao salvar:** grava o resultado, a observação, a data/hora de execução e o usuário. Só altera os itens que mudaram, em uma única escrita.
- **Abrir corretiva** (`abrirCorretivaItemChecklist`): cria um chamado corretivo para o equipamento do item, herdando o contrato da OS. O histórico guarda uma marca que impede abrir duas corretivas para o mesmo item.
- **Concluir uma OS com itens pendentes** é permitido. O motivo informado fica registrado no histórico como justificativa.

## 5. Quando um chamado está atrasado

A função é `avaliarAtrasoChamado(linha, agora)`. Chamados **concluídos ou cancelados nunca ficam atrasados**. Os demais ficam atrasados se:

| Motivo | Condição |
|---|---|
| data prevista vencida | `DATA_PREVISTA` < hoje |
| prazo de atendimento vencido | `PRAZO_ATENDIMENTO` < agora e sem `DATA_INICIO_ANDAMENTO` |
| prazo de solução vencido | `PRAZO_SOLUCAO` < agora e sem `DATA_FINALIZACAO` |

Os dois últimos motivos formam o "fora do prazo de SLA", usado no indicador **Corretivas fora do prazo** do Dashboard.

## 6. Indicadores "Manutenção do mês"

A função é `buscarIndicadoresManutencao()` em [DashboardBackend.js](../apps/Controller/Dashboard/DashboardBackend.js). Os chamados cancelados são ignorados.

**Preventivas do mês:**
- tipo `preventiva` com competência igual ao mês atual;
- sem competência (preventivas manuais), vale o mês da data prevista ou, na falta dela, o da data de abertura.

**Itens executados:**
- itens dessas OS com resultado diferente de `pendente`;
- o percentual é calculado sobre o total de itens.

**Preventivas atrasadas:** não concluídas e com a data prevista já passada, de qualquer competência (a de um mês anterior que ficou para trás também conta).

**Corretivas fora do prazo:** tipo `corretiva` com prazo de SLA vencido (seção 5).

**Ranking:** corretivas abertas nos últimos 12 meses, agrupadas por equipamento (os 8 primeiros).

Os indicadores dependem das colunas novas de `tbl_chamados` (CONTRATO_ID em diante). Os chamados antigos ficam fora deles até rodar `preencherCamposNovosChamados()` (veja o documento [07](07-implantacao-e-operacao.md)).

## 7. Manutenção das preventivas

Relatório para conferir a nota fiscal da empresa. A função é `buscarRelatorioManutencaoPreventiva(contratoId, competencia)` em [RelatorioManutencaoBackend.js](../apps/Controller/Relatorios/back/RelatorioManutencaoBackend.js). Cada relatório tem seus próprios arquivos (`Relatorio<Nome>Backend.js`, `Relatorio<Nome>JS.html`, `Relatorio<Nome>CSS.html`); `RelatoriosBackend.js`, `RelatoriosJS.html` e `RelatoriosCSS.html` guardam só a parte comum.

**Filtro:** contrato, competência ou os dois; pelo menos um. O resultado sai em **seções, uma por contrato + competência** (cada uma corresponde a uma medição/NF). Com mais de uma seção, aparece no fim o quadro **Total geral**.

**OS consideradas:** chamados com tipo `preventiva` que não estejam cancelados nem excluídos. A competência é a gravada na OS; a preventiva manual que não tem competência usa o mês da data de finalização (ou, se ainda aberta, da abertura).

**Equipamentos da OS:** os do checklist mais os da lista do chamado (`tbl_chamado_equipamentos`; sem lista, a coluna B). Se o equipamento aparece em mais de uma OS da mesma seção, conta uma vez.

**Equipamento com preventiva feita:**
- tem pelo menos um item de checklist com resultado `ok` ou `nao_conforme`; **ou**
- a OS está **Concluída**, a não ser que todos os itens dele estejam `nao_aplicavel`. Isso cobre a OS fechada sem marcar o checklist e a preventiva manual sem checklist.

**Observações por equipamento:** cada seção lista os equipamentos com observação no chamado: a de encerramento (`tbl_chamado_equipamentos`, coluna F) e as dos itens do checklist (`tbl_chamado_checklist`, coluna H), A de encerramento sai sem rótulo; a de item leva a descrição do item. Se a seção tiver mais de uma OS, aparece o número da OS.

**Resolução do chamado:** depois das observações, o motivo informado ao concluir cada OS. Não há coluna própria: o texto é lido do histórico (`tbl_chamado_historico`, entrada `[SISTEMA] Chamado encerrado… Motivo: …`), a mais recente de cada OS concluída.

Os demais vão para a tabela "sem preventiva executada", com a OS e a situação: itens pendentes com a OS ainda aberta, ou todos os itens marcados como N/A.

**Agrupamento e valor:**
- O equipamento é ligado ao serviço **Preventiva** do contrato com a mesma especificação. A comparação usa NOME = categoria, MODELO = tipo e CAPACIDADE = capacidade, sem diferenciar maiúsculas. É a mesma regra da aba Serviços do contrato.
- O valor unitário vem da coluna K de `tbl_contratos_servicos`.
- O valor total da linha é a quantidade vezes o valor unitário. O total geral soma só as linhas com valor.

**Ordem:** por categoria, tipo e capacidade (numérica).
