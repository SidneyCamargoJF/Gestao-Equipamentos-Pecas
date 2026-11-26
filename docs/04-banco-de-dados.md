# 04 — Banco de dados (planilha)

Cada tabela é uma aba da planilha vinculada ao projeto.

## Regras gerais

- **Linhas:** a linha 1 guarda o índice (SEQUENCE), a linha 2 o cabeçalho, e os dados começam na **linha 3** (`firstLine… = 3`).
- **Colunas:** nunca reordene as colunas existentes. Colunas novas entram **no fim** da aba, e a constante `numColumns…` do model é atualizada.
- **ID:** é o último ID da aba mais 1 (`proximoIdTabela`), calculado dentro de `executarComLock`.
- **Exclusão lógica:** grava a data de exclusão (`dd/MM/yyyy`) e pinta a linha de `#F4CCCC`. Reativar limpa a data e volta a cor `#FFFFFF`. Nenhuma linha é apagada.
- **Datas:** `dd/MM/yyyy`, ou `dd/MM/yyyy HH:mm` quando a hora importa. O fuso é `America/Sao_Paulo`.
- **Textos que o Sheets converteria** (por exemplo `2026-01`, que vira data) são gravados com apóstrofo inicial (`textoLiteralPlanilha`).
- **Índices nos models:** os models usam **0-based** ou **1-based** conforme o arquivo, indicado em cada tabela abaixo. Veja o documento [06](06-guia-de-desenvolvimento.md).

As letras indicam a coluna na planilha.

---

## tbl_chamados — [ChamadosModel.js](../apps/01-Model/ChamadosModel.js) (1-based)

| Col | Constante | Conteúdo |
|---|---|---|
| A | `ticketsIdCol` | ID |
| B | `ticketsEquipamentoIdCol` | ID do 1º equipamento do chamado (`tbl_equipamentos`). A lista completa fica em `tbl_chamado_equipamentos`. Vazio na OS preventiva |
| C | `ticketsReasonCol` | Motivo/defeito |
| D | `ticketsTypeCol` | Tipo: corretiva, preventiva, instalacao, limpeza, desinstalacao, outro |
| E | `ticketsPriorityCol` | Prioridade: baixa, media, alta, urgente |
| F | `ticketsDtAberturaCol` | Data de abertura |
| G | `ticketsAbertoPorCol` | Nome do usuário que abriu (`Sistema` nas automáticas) |
| H | `ticketsAtribuidoCol` | Atribuído a (empresa ou pessoa) |
| I | `ticketsDtInicioAndamentoCol` | Data em que passou a "Em Andamento" |
| J | `ticketsDtFinalizacaoCol` | Data de conclusão |
| K | `ticketsObservacaoCol` | Descrição/observação |
| L | `ticketsStatusCol` | `Aberto`, `Em Andamento`, `Concluido`, `Cancelado` |
| M | `ticketsDtAlteracaoCol` | Data da última alteração |
| N | `ticketsContratoIdCol` | ID do contrato vinculado |
| O | `ticketsOrigemCol` | `manual` ou `automatica` |
| P | `ticketsCompetenciaCol` | `AAAA-MM`, só nas preventivas automáticas (texto) |
| Q | `ticketsDataPrevistaCol` | Data prevista (`dd/MM/yyyy`): último dia da competência |
| R | `ticketsPrazoAtendimentoCol` | Prazo de atendimento pelo SLA (`dd/MM/yyyy HH:mm`) |
| S | `ticketsPrazoSolucaoCol` | Prazo de solução pelo SLA (`dd/MM/yyyy HH:mm`) |
| T | `ticketsFornecedorIdCol` | ID do fornecedor do contrato |
| U | `ticketsDtExclusaoCol` | Data de exclusão (desativação) |

As colunas N a U existem desde a Etapa 3. Para preencher chamados antigos, use `preencherCamposNovosChamados()`. O significado de cada uma está no documento [03](03-manutencao-por-contrato.md).

## tbl_chamado_equipamentos (1-based)

Equipamentos de cada chamado: um chamado pode ter vários. Chamados sem linhas nesta aba usam o equipamento da coluna B de `tbl_chamados`.

| Col | Conteúdo |
|---|---|
| A | ID |
| B | ID do chamado |
| C | ID do equipamento |
| D | Data de cadastro |
| E | Data de exclusão (equipamento retirado do chamado na edição) |
| F | Observação de encerramento do equipamento (preventiva). Equipamento de OS automática ganha a linha quando recebe observação |

## tbl_chamado_historico (1-based)

| Col | Conteúdo |
|---|---|
| A | ID |
| B | ID do chamado |
| C | Texto. As entradas automáticas começam com `[SISTEMA] ` |
| D | Data/hora (`dd/MM/yyyy HH:mm`) |
| E | Data de alteração (edição de anotação) |

## tbl_chamado_anexos (1-based)

| Col | Conteúdo |
|---|---|
| A | ID |
| B | ID do chamado |
| C | Tipo (`Relatório`, `Nota Fiscal`) |
| D | Nome do arquivo |
| E | URL no Drive |
| F | Hash (detecta arquivo duplicado) |
| G | Data do upload |
| H | Data de exclusão |

## tbl_chamado_checklist (1-based)

Itens a executar numa OS: uma linha para cada combinação de equipamento e item.

| Col | Conteúdo |
|---|---|
| A | ID |
| B | ID do chamado (OS) |
| C | ID do equipamento |
| D | ID do item em `tbl_contratos_Checklist` |
| E | Descrição (cópia, sem prefixo de periodicidade) |
| F | Periodicidade |
| G | Resultado: `pendente`, `ok`, `nao_conforme`, `nao_aplicavel` |
| H | Observação |
| I | Executado em (`dd/MM/yyyy HH:mm`) |
| J | Registrado por (nome do usuário) |
| K | Data de cadastro |
| L | Data de alteração |
| M | Data de exclusão |

---

## tbl_contratos — [ContratoModel.js](../apps/01-Model/ContratoModel.js) (0-based)

| Col | Constante | Conteúdo |
|---|---|---|
| A | `contractIdCol` | ID |
| B | `contractNumberCol` | Número |
| C | `contractNameCol` | Nome |
| D | `contractDataEncerramento` | Data de encerramento |
| E | `contractSEICol` | Processo SEI |
| F | `contractDataFechamentoCol` | Data de fechamento |
| G | `contractEmpresaCol` | Empresa (razão social ou nome fantasia do fornecedor, em texto) |
| H | `contractObjetoCol` | Objeto |
| I | `contractObservacoesCol` | Observações |
| J | `contractValorCol` | Valor |
| K | `contractDataInicialCol` | Data inicial |
| L | `contractDataFinalCol` | Data final |
| M | `contractContatoEmpresaCol` | Contato na empresa |
| N | `contractTelefoneCol` | Telefone |
| O | `contractEmailCol` | E-mail |
| P | `contractGestorCol` | Gestor |
| Q | `contractActiveCol` | Ativo (`Y`/`N`) |
| R | `contractSituacaoCol` | Situação |
| S | `contractDataAletracaoCol` | Data de alteração |
| T | `contractDataExclusaoCol` | Data de exclusão |
| U | `contractDataBasePreventivaCol` | Data base do ciclo das preventivas |

### Tabelas filhas do contrato (0-based, um model por arquivo)

**tbl_contratos_equipamentos** — [ContratoEquipamentosModel.js](../apps/01-Model/ContratoEquipamentosModel.js)

| Col | Conteúdo |
|---|---|
| A | ID |
| B | ID do contrato |
| C | ID do equipamento |
| D | Data de cadastro |
| E | Data de exclusão |

**tbl_contratos_servicos** — [ContratoServicosModel.js](../apps/01-Model/ContratoServicosModel.js)

| Col | Conteúdo |
|---|---|
| A | ID |
| B | ID do contrato |
| C | Tipo de manutenção (`Preventiva`/`Corretiva`) |
| D | Categoria |
| E | Tipo |
| F | Capacidade |
| G | Periodicidade |
| H | Data de cadastro |
| I | Data de exclusão |
| J | Data de alteração |
| K | Valor unitário (R$) por equipamento atendido. Usado no relatório de manutenção das preventivas |

**tbl_contratos_produtos** — [ContratoProdutosModel.js](../apps/01-Model/ContratoProdutosModel.js)

| Col | Conteúdo |
|---|---|
| A | ID |
| B | ID do contrato |
| C | Nome |
| D | Data de cadastro |
| E | Data de exclusão |

**tbl_contratos_Checklist** — [ContratoChecklistModel.js](../apps/01-Model/ContratoChecklistModel.js). O nome da aba tem o "C" maiúsculo.

| Col | Conteúdo |
|---|---|
| A | ID |
| B | ID do contrato |
| C | Descrição. Linhas antigas podem ter prefixo `[Mensal] ` |
| D | Data de cadastro |
| E | Data de exclusão |
| F | Data de alteração |
| G | Periodicidade (`mensal` … `anual`) |
| H | ID do serviço (`tbl_contratos_servicos`) |
| I | Categoria do equipamento a que o item se aplica (compara com o NOME do equipamento). Vazia = todos os equipamentos do contrato |
| J | Tipo do equipamento (compara com o MODELO). Vazio = todos os tipos da categoria |

**tbl_contratos_sla** — [ContratoSlaModel.js](../apps/01-Model/ContratoSlaModel.js)

| Col | Conteúdo |
|---|---|
| A | ID |
| B | ID do contrato |
| C | Prioridade (`baixa`, `media`, `alta`, `urgente`) |
| D | Prazo de atendimento (horas) |
| E | Prazo de solução (horas) |
| F | Horas úteis (`Y`/`N`) |
| G | Data de cadastro |
| H | Data de alteração |
| I | Data de exclusão |

**tbl_contratos_anexos** — [ContratoAnexosModel.js](../apps/01-Model/ContratoAnexosModel.js). Tem a mesma estrutura de `tbl_chamado_anexos`, com o ID do contrato na coluna B.

Ao salvar um contrato, as linhas filhas anteriores (equipamentos, serviços, produtos, checklist e SLA) recebem data de exclusão e as atuais são gravadas de novo com IDs novos (`excluirAnterioresContrato`). Por isso, o `CHECKLIST_ID` gravado numa OS já gerada pode apontar para uma linha que depois foi excluída. A OS guarda uma cópia da descrição e da periodicidade e não depende dessa linha.

---

## tbl_equipamentos — [EquipamentosModel.js](../apps/01-Model/EquipamentosModel.js) (0-based, classe `EquipmentsModel`)

| Col | Conteúdo |
|---|---|
| A | ID |
| B | Nome |
| C | Marca |
| D | Capacidade |
| E | Modelo |
| F | Patrimônio |
| G | Sequência |
| H | Localização |
| I | Fornecedor |
| J | Data de entrada |
| K | Nota fiscal |
| L | SEI |
| M | Data de garantia |
| N | Valor de aquisição |
| O | Observações |
| P | Ativo (`Y`/`N`) |
| Q | Data de cadastro |
| R | Data de alteração |
| S | Data de exclusão |
| T | Estado: `Novo`, `Bom`, `Ruim`, `Péssimo` ou `Velho`. O cabeçalho precisa ser **ESTADO**, porque a leitura pela classe `EquipmentsModel` usa o nome do cabeçalho |

As constantes de `EquipamentosModel.js` são 0-based (A = 0), e o model liga `colunasBaseZero` para a classe base `SheetModel` converter. A leitura `ReadEquipments()` usa os nomes do cabeçalho da linha 2 e descarta as linhas com data de exclusão (S).

## tbl_pecas — [PecasModel.js](../apps/01-Model/PecasModel.js) (0-based)

| Col | Conteúdo |
|---|---|
| A | ID |
| B | Nome |
| C | Marca |
| D | Modelo |
| E | Capacidade |
| F | Número de série |
| G | Local |
| H | Fornecedor |
| I | Número da NF |
| J | Data da NF |
| K | Garantia |
| L | Data final da garantia |
| M | Modalidade |
| N | Valor |
| O | Número SEI |
| P | Data de cadastro |
| Q | Data de alteração |
| R | Data de exclusão |
| S | Tipo: `peca` ou `produto` (produto adquirido do estoque); vazio = peça |

## tbl_garantias — [GarantiasModel.js](../apps/01-Model/GarantiasModel.js) (0-based)

Um acionamento de garantia de uma peça/produto por linha. Criada sozinha no primeiro uso (ou por `criarTabelasNovasSeNecessario()`), junto com `tbl_garantia_historico` e `tbl_garantia_anexos`.

| Col | Conteúdo |
|---|---|
| A | ID |
| B | ID da peça/produto (`tbl_pecas`) |
| C | Fornecedor (nome, como no item) |
| D | Data de abertura |
| E | Defeito |
| F | Protocolo do fornecedor |
| G | Status: Aberta, Enviada ao fornecedor, Em análise, Atendida, Negada, Cancelada |
| H | Data de envio ao fornecedor |
| I | Prazo de resposta |
| J | Resultado: `troca`, `reparo`, `reembolso` ou `negada` |
| K | Resolução / motivo da negativa |
| L | Data de encerramento |
| M | Aberto por |
| N | Data de alteração |
| O | Data de exclusão (cancelamento) |

**tbl_garantia_historico** (0-based): ID, ID da garantia, texto, data/hora, usuário, data de exclusão.

**tbl_garantia_anexos** (0-based): mesmo formato das outras tabelas de anexo (ID, ID da garantia, tipo, nome do arquivo, URL, hash, data do upload, data de exclusão).

## tbl_pecas_aquisicoes — [PecasAquisicoesModel.js](../apps/01-Model/PecasAquisicoesModel.js) (0-based)

Aquisições (compras) de uma peça/produto, com a nota fiscal. Criada sozinha na primeira aquisição incluída (ou por `criarTabelasNovasSeNecessario()`). As 5 mais recentes (mais a nota do cadastro do item) são sugeridas no e-mail de garantia.

| Col | Conteúdo |
|---|---|
| A | ID |
| B | ID da peça/produto (`tbl_pecas`) |
| C | Número da nota |
| D | Fornecedor |
| E | Data de aquisição |
| F | Nome do arquivo da nota |
| G | URL do arquivo (Drive) |
| H | ID do arquivo no Drive (usado para anexar no e-mail) |
| I | Data de cadastro |
| J | Data de exclusão |
| K | ID da nota fiscal de origem (`tbl_notas_fiscais`), quando veio de Compras |

## tbl_notas_fiscais — [NotasFiscaisModel.js](../apps/01-Model/NotasFiscaisModel.js) (0-based)

Cabeçalho da nota (Compras → Notas fiscais). As quatro abas de Compras são criadas sozinhas no primeiro uso (ou por `criarTabelasNovasSeNecessario()`).

| Col | Conteúdo |
|---|---|
| A | ID |
| B | Número |
| C | Série |
| D | Chave de acesso (44 dígitos) |
| E | Fornecedor (nome) |
| F | CNPJ do fornecedor (só dígitos) |
| G | Data de emissão |
| H | Valor total |
| I | Tipo de garantia: `geral` ou `produto` |
| J | Garantia geral (meses) |
| K | Garantia geral (data final) |
| L | Observação |
| M | Data de cadastro |
| N | Data de alteração |
| O | Data de exclusão |

**tbl_notas_fiscais_itens** (0-based): ID, ID da nota, nº do item, código no fornecedor, descrição, NCM, unidade, quantidade, valor unitário, valor total, ID da peça/produto relacionado (vazio = sem relação), garantia do produto (meses), garantia do produto (data final), data de exclusão. Ao alterar a nota, os itens anteriores recebem a data de exclusão e os atuais são gravados de novo.

**tbl_notas_fiscais_anexos** (0-based): formato das outras tabelas de anexo; tipos Nota escaneada, XML e Outro.

**tbl_produto_fornecedor** (0-based): ID, ID da peça/produto, fornecedor, CNPJ, código no fornecedor, descrição no fornecedor, data de cadastro, data de exclusão. Usada para relacionar sozinho os itens do XML (fornecedor + código).

## tbl_fornecedor — [FornecedorModel.js](../apps/01-Model/FornecedorModel.js) (1-based)

| Col | Conteúdo |
|---|---|
| A | ID |
| B | Prestador de serviço |
| C | Distribuidor de produtos |
| D | Razão social |
| E | Nome fantasia |
| F | CNPJ |
| G | Inscrição estadual |
| H | Inscrição municipal |
| I | E-mail |
| J | Telefone |
| K | Celular |
| L | WhatsApp |
| M | CEP |
| N | Logradouro |
| O | Número |
| P | Bairro |
| Q | Cidade |
| R | Estado |
| S | Complemento |
| T | Data de cadastro |
| U | Data de alteração |
| V | Status |

## tbl_marca — [MarcasModel.js](../apps/01-Model/MarcasModel.js) (0-based)

| Col | Conteúdo |
|---|---|
| A | ID |
| B | Nome |
| C | Data de cadastro |
| D | Data de exclusão |
| E | Data de alteração |

## tbl_usuarios — [UsuariosModel.js](../apps/01-Model/UsuariosModel.js) (0-based)

| Col | Conteúdo |
|---|---|
| A | ID |
| B | Matrícula |
| C | Usuário: login Google, comparado sem o `@domínio` e sem diferenciar maiúsculas |
| D | Nome |
| E | Lotação |
| F | Setor |
| G | Data de cadastro |
| H | Data de exclusão |
| I | E-mail de contato (opcional; coluna incluída depois, no fim da aba) |
| J | Telefone / ramal (opcional; coluna incluída depois, no fim da aba) |

Linhas cadastradas antes da coluna **Usuário** existir precisam ser corrigidas à mão: até a correção, as colunas ficam deslocadas.

## tbl_modelos_email — [ModelosEmailModel.js](../apps/01-Model/ModelosEmailModel.js) (0-based)

Modelos de e-mail do chamado (Configuração → Modelos de e-mail). Criada pelo sistema na primeira vez que os modelos são abertos, já com cinco modelos iniciais (ou por `criarTabelasNovasSeNecessario()`).

| Col | Conteúdo |
|---|---|
| A | ID |
| B | Nome (único entre os ativos) |
| C | Assunto (aceita `{{campo}}`) |
| D | Corpo (aceita `{{campo}}`) |
| E | Data de cadastro |
| F | Data de alteração |
| G | Data de exclusão |
| H | Contexto: `chamado` ou `garantia`; vazio = chamado (coluna incluída depois; numa aba antiga, o sistema cria o cabeçalho e os modelos de garantia na primeira leitura) |

Os campos aceitos estão em `camposModeloEmail_()` ([ModelosEmailBackend.js](../apps/Controller/ModelosEmail/back/ModelosEmailBackend.js)). Cada envio fica no histórico do chamado (`[SISTEMA] E-mail enviado para ...`) e em `tbl_chamado_emails`.

## tbl_chamado_emails — [ChamadoEmailsModel.js](../apps/01-Model/ChamadoEmailsModel.js) (1-based)

Um registro por e-mail enviado pelo sistema; o mais recente do chamado é o que o **Reenviar e-mail** da edição carrega. Criada sozinha no primeiro envio (ou por `criarTabelasNovasSeNecessario()`).

| Col | Conteúdo |
|---|---|
| A | ID |
| B | ID do chamado |
| C | Para (separados por `; `) |
| D | Cópia |
| E | Assunto |
| F | Mensagem |
| G | Enviado em (dd/MM/yyyy HH:mm) |
| H | Enviado por (nome do usuário) |
| I | Data de exclusão |

## Tabelas auxiliares (1-based)

**tbl_localizacao**

| Col | Conteúdo |
|---|---|
| A | ID |
| B | Nome |
| C | Data de cadastro |
| D | Data de exclusão |
| E | Data de alteração |

**tbl_funcionarios**

| Col | Conteúdo |
|---|---|
| A | ID |
| B | Nome |

## Relacionamentos

```
tbl_fornecedor ◄─(nome)── tbl_contratos ──┬─< tbl_contratos_equipamentos >── tbl_equipamentos
       ▲                       ▲          ├─< tbl_contratos_servicos ──< tbl_contratos_Checklist
       │                       │          ├─< tbl_contratos_produtos
       │                       │          ├─< tbl_contratos_sla
       │                       │          └─< tbl_contratos_anexos
       │ FORNECEDOR_ID         │ CONTRATO_ID
       └──────────────── tbl_chamados >── tbl_equipamentos (ID_EQUIPAMENTO)
                               ├─< tbl_chamado_historico
                               ├─< tbl_chamado_anexos
                               └─< tbl_chamado_checklist >── tbl_contratos_Checklist
```

O contrato aponta para o fornecedor **pelo nome**, gravado como texto em EMPRESA. O chamado guarda o ID do fornecedor resolvido no momento da abertura.
