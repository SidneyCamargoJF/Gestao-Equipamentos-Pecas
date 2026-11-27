# 07 — Implantação e operação

## Pré-requisitos

- Node.js e clasp (`npm i -g @google/clasp`), com `clasp login` feito na conta que tem acesso ao projeto.
- Um `.clasp.json` local apontando para o `scriptId` do projeto. Esse arquivo não é versionado.
- A planilha vinculada ao projeto, com todas as abas `tbl_*` descritas no documento [04](04-banco-de-dados.md).

## Publicar uma alteração

```bash
clasp push          # envia os arquivos locais (sobrescreve o projeto no Apps Script)
```

Depois, no editor do Apps Script, vá em **Implantar → Gerenciar implantações** e edite a implantação do Web App para usar a **nova versão**. Até isso ser feito, a URL `/exec` continua servindo a versão anterior. A URL `/dev` (testar implantação) sempre mostra o código mais recente.

Se o `clasp push` falhar com `Syntax error`, nada é enviado. Causas comuns: campo de classe, identificador declarado duas vezes ou arquivo com `require`. Veja o documento [06](06-guia-de-desenvolvimento.md).

## Configuração inicial

As migrações também podem ser feitas pelo sistema, em **Configuração → Migrações da planilha** (botões **Verificar estrutura** e **Executar migrações**; executar é só para administradores da propriedade `ADMINS`).

No editor do Apps Script (selecione a função e clique em **Executar**):

| Função | Para quê |
|---|---|
| `executarMigracoes()` | **Migrações da planilha** ([Migracoes.js](../apps/01-Model/Migracoes.js)): cria as abas que faltam e completa os cabeçalhos das colunas novas de **todas** as tabelas, e roda as migrações de dados pendentes. Rode depois de cada publicação que mexa em tabelas; pode ser repetida |
| `verificarEstruturaTabelas()` | Só confere (não muda nada) e mostra no log, aba por aba, o que falta e os cabeçalhos com nome diferente do esperado |
| `listarMigracoes()` | Mostra quais migrações de dados já rodaram e quando |
| `instalarGatilhoPreventivas()` | Cria o gatilho diário (06h) de `gerarPreventivasDoMes`. Não duplica se já existir |

O resultado de cada execução aparece em **Registro de execução** (log). `criarTabelasNovasSeNecessario()` continua existindo e hoje faz o mesmo que `executarMigracoes()`.

### Migrações

- **Estrutura (roda sempre):** uma por aba, a partir do esquema de todas as tabelas (`esquemaTabelas_`). Aba que não existe é criada com o cabeçalho na linha 2; aba que existe só recebe os nomes de cabeçalho que estão **vazios** (as colunas novas no fim). Nada é renomeado, reordenado ou apagado, e os dados não são tocados. Cabeçalho com nome diferente aparece como aviso no log. Em aba antiga com o cabeçalho na linha 1 (e a linha 2 vazia), completa a linha 1.
- **Dados (rodam uma vez cada):** registradas nas Propriedades do script (`MIGRACOES_APLICADAS`):

| Id | O que faz |
|---|---|
| `2026-01-periodicidade-checklist` | Grava a PERIODICIDADE dos itens antigos do checklist do contrato (prefixo `[Mensal]` etc.) |
| `2026-01-campos-novos-chamados` | Preenche ORIGEM, contrato, fornecedor e prazos de SLA dos chamados antigos |
| `2026-11-modelos-email-contexto` | Coluna CONTEXTO e modelos iniciais de garantia em `tbl_modelos_email` |
| `2026-11-estoque-entradas-notas` | Entradas de estoque das notas fiscais lançadas antes do estoque |

A aba legada `tab_materiais` (cadastro de materiais antigo, fora do menu) não entra nas migrações.

### Administradores

Em **Configurações do projeto → Propriedades do script**, crie a propriedade `ADMINS` com os e-mails separados por vírgula. Só esses usuários poderão usar o botão **Gerar preventivas**. Se a propriedade estiver vazia, todos podem.

### E-mail

O envio de e-mail do chamado usa a **API do Gmail** (serviço avançado `Gmail`, já declarado no `appsscript.json`), porque só ela aceita o cabeçalho da confirmação de leitura (`Disposition-Notification-To`). Se o serviço não estiver habilitado, o envio cai no `MailApp`, sem confirmação, e a tela avisa.

Depois de publicar, cada usuário precisa **autorizar de novo** o app (envio de e-mail em seu nome). Se o domínio restringir o acesso de apps ao Gmail, o administrador do Google Workspace precisa liberar este projeto. O e-mail sai da conta de quem está usando o sistema e conta na cota diária de envio dessa conta.

A aba `tbl_modelos_email` é criada sozinha ao abrir **Configuração → Modelos de e-mail**, e a `tbl_chamado_emails` no primeiro envio (ou as duas com `criarTabelasNovasSeNecessario()`).

### Estoque

As abas `tbl_estoque_movimentos` e `tbl_estoque_parametros` são criadas sozinhas no primeiro uso (ou com `criarTabelasNovasSeNecessario()`). As notas fiscais lançadas antes do estoque não têm entradas: use o botão **↻ Atualizar entradas das notas** (Estoque → Movimentações) uma vez.

### Compras

As abas `tbl_notas_fiscais`, `tbl_notas_fiscais_itens`, `tbl_notas_fiscais_anexos` e `tbl_produto_fornecedor` são criadas sozinhas na primeira nota salva ou relação incluída (ou com `criarTabelasNovasSeNecessario()`). Na aba `tbl_pecas_aquisicoes` já existente, o cabeçalho da coluna K (NF_ID) é criado no mesmo momento. O XML da NF-e é lido no navegador; os arquivos vão para a pasta de anexos do Drive.

### Garantias

As abas `tbl_garantias`, `tbl_garantia_historico` e `tbl_garantia_anexos` são criadas sozinhas na primeira garantia aberta (ou com `criarTabelasNovasSeNecessario()`). A coluna **S (Tipo)** de `tbl_pecas` é preenchida ao salvar cada item; os itens antigos ficam vazios e contam como peça.

A aba `tbl_pecas_aquisicoes` é criada sozinha na primeira aquisição incluída num item. Os arquivos das notas vão para a mesma pasta de anexos do Drive. Para anexar arquivos do Drive no e-mail, o app passa a ler esses arquivos (`DriveApp`), o que já fazia parte da autorização dos anexos.

### Usuários

Cadastre cada pessoa em **Configuração → Usuários**. O campo **Usuário** é o login Google, sem o domínio. Sem cadastro, a pessoa aparece como "Desconhecido" em "Aberto por".

## Rotina

| Quando | O quê |
|---|---|
| Todo dia, 06h (automático) | `gerarPreventivasDoMes()` cria as OS do mês corrente que ainda não existam. Na prática, gera no dia 1 e, nos outros dias, só cria o que surgir depois (contrato novo, item novo) |
| Ao cadastrar um contrato | Preencher a data base preventiva, os serviços (com um do tipo **Preventiva**), o checklist com periodicidade, os equipamentos e o SLA |
| Ao gerar fora de hora | Botão **Gerar preventivas** na Consulta de Chamados (período e contrato), ou `gerarPreventivasDoMes('AAAA-MM')` no editor para outra competência |

## Diagnóstico

| Sintoma | Verificar |
|---|---|
| Painel "Manutenção do mês" zerado | As OS da competência foram geradas? Os chamados antigos foram migrados (`preencherCamposNovosChamados`)? |
| Chamado aberto sem contrato | O equipamento está vinculado ao contrato (aba Equipamentos do contrato)? O contrato está ativo, sem encerramento e vigente na data? |
| Chamado sem prazos | O contrato tem SLA para a prioridade escolhida? |
| FORNECEDOR_ID vazio | O campo Empresa do contrato é igual à razão social ou ao nome fantasia de algum fornecedor? |
| Contrato não gera OS | Veja o retorno `detalhes` de `gerarPreventivasDoMes`: antes da data base, nenhum item devido, já gerada ou sem equipamentos ativos |
| "Aberto por: Desconhecido" | O usuário não está cadastrado ou o login está diferente do e-mail |
| Gatilho não roda | **Acionadores** no editor: o gatilho existe? As execuções mostram erro? |

Os logs ficam em **Execuções** no editor do Apps Script (`exceptionLogging: STACKDRIVER`).
