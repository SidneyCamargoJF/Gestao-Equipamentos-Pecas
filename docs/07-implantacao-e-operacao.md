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

Execute uma vez no editor do Apps Script (selecione a função e clique em **Executar**):

| Função | Para quê |
|---|---|
| `instalarGatilhoPreventivas()` | Cria o gatilho diário (06h) de `gerarPreventivasDoMes`. Não duplica se já existir |
| `migrarPeriodicidadeChecklist()` | Grava a coluna PERIODICIDADE nos itens antigos do checklist, lida do prefixo `[Mensal]` etc. |
| `preencherCamposNovosChamados()` | Preenche ORIGEM, contrato, fornecedor e prazos de SLA nos chamados criados antes dessas colunas existirem |

As três funções podem ser executadas de novo sem efeito colateral.

### Administradores

Em **Configurações do projeto → Propriedades do script**, crie a propriedade `ADMINS` com os e-mails separados por vírgula. Só esses usuários poderão usar o botão **Gerar preventivas do mês**. Se a propriedade estiver vazia, todos podem.

### E-mail

O envio de e-mail do chamado usa o `MailApp`. Na primeira publicação com esse recurso, cada usuário precisa **autorizar de novo** o app (envio de e-mail em seu nome). O e-mail sai da conta de quem está usando o sistema e conta na cota diária de envio dessa conta.

A aba `tbl_modelos_email` é criada sozinha ao abrir **Configuração → Modelos de e-mail** (ou com `criarTabelasNovasSeNecessario()`).

### Usuários

Cadastre cada pessoa em **Configuração → Usuários**. O campo **Usuário** é o login Google, sem o domínio. Sem cadastro, a pessoa aparece como "Desconhecido" em "Aberto por".

## Rotina

| Quando | O quê |
|---|---|
| Todo dia, 06h (automático) | `gerarPreventivasDoMes()` cria as OS do mês corrente que ainda não existam. Na prática, gera no dia 1 e, nos outros dias, só cria o que surgir depois (contrato novo, item novo) |
| Ao cadastrar um contrato | Preencher a data base preventiva, os serviços (com um do tipo **Preventiva**), o checklist com periodicidade, os equipamentos e o SLA |
| Ao gerar fora de hora | Botão **Gerar preventivas do mês** na Consulta de Chamados, ou `gerarPreventivasDoMes('AAAA-MM')` no editor para outra competência |

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
