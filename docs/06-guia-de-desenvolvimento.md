# 06 — Guia de desenvolvimento

Regras que todo código novo deve seguir. Antes de mudar qualquer coisa, leia o código vizinho e siga o padrão que já existe.

## Apps Script

1. **Escopo global único.** Todos os `.js` são concatenados num só escopo, sem `import`/`export`.
   - Nunca declare duas vezes o mesmo `function`, `let`, `const` ou `class`, mesmo em arquivos diferentes: o projeto inteiro deixa de carregar.
   - Funções auxiliares internas levam o sufixo `_` (`montarContratoResumo_`).
2. **Ordem de carregamento.** Uma classe precisa estar declarada antes de outro arquivo fazer `extends` dela. O clasp envia os arquivos em ordem alfabética de caminho, por isso a classe base fica em `01-SheetModel.js`, com prefixo numérico.
3. **Sem campos de classe.** O parser do Apps Script não aceita `static x = ...` nem `x = ...` no corpo da classe; o erro é `ParseError: Unexpected token =`. Use getters ou atribua no `constructor`.
4. **Nada de `require`/`module.exports`** nos arquivos que vão para o servidor.
5. **Limite de 6 minutos por execução.** Leia cada aba uma vez (`Read*()`), trabalhe em memória e grave em bloco com `setValues`. Evite `getRange().setValue()` dentro de laço.

## Comunicação cliente ↔ servidor

- **Formato de retorno:** as funções chamadas pela tela devolvem `{ sucesso: boolean, mensagem: string, ... }` e tratam os erros com `try/catch`.
- **Sem `Date` no retorno:** o `google.script.run` devolve `null` em silêncio quando o objeto contém um `Date`. Converta com `dateToString` ou `dateTimeToString`. Os `Read*()` já fazem isso.
- **Chamadas no cliente:** use `await runServerFunction('fn', ...args)`.
- **HTML dinâmico:** passe por `escapeHtml()` todo texto interpolado em `innerHTML`.
- **Mensagens:** use `mostrarMensagem(texto, tipo)` (`apps/Modal/ModalJS.html`); `tipo` é `sucesso`, `erro`, `aviso` ou `info`. Abre o modal `#modalMensagem`, enfileira mensagens seguidas e devolve uma Promise resolvida quando a pessoa fecha.
  - `alert()` é redirecionado para esse modal, com o tipo deduzido do texto. Diferente do alert do navegador, ele **não bloqueia**: o código depois dele continua rodando.
  - O alert original fica em `window.alertNativo`. O `confirm()` continua sendo o do navegador.
- **Arquivos de template:** os `*JS.html` envolvem o código em `<script>`. Os `*CSS.html` contêm CSS puro, sem `<style>`.

## Planilha

- **Linhas:** dados a partir da linha 3. A linha 1 é o índice, a linha 2 o cabeçalho.
- **Colunas novas:** sempre **no fim da aba**, nunca reordenando as existentes.
  1. Crie a coluna na planilha.
  2. Adicione a constante no model.
  3. Atualize `numColumns…`.
  4. Revise toda gravação que monta a linha inteira (`setValues` de N colunas).
- **ID:** use `proximoIdTabela(aba, firstLine)` **dentro de** `executarComLock(...)`. O lock é reentrante: uma função com lock pode chamar outra com lock.
- **Exclusão lógica:** grave a data de exclusão e pinte a linha (`#F4CCCC`). Nunca apague linhas.
- **Datas:** formato `dd/MM/yyyy` ou `dd/MM/yyyy HH:mm`, fuso `America/Sao_Paulo`. Para ler datas que podem vir como `Date` ou como texto, use `parseDataFlex`.
- **Textos que parecem data** (`2026-01`): grave com `textoLiteralPlanilha(valor)`.
- **Histórico de chamado:**
  - `adicionarHistoricoSistema(chamadoId, texto)` para um registro;
  - `adicionarHistoricoSistemaLote(itens)` para vários.

### 0-based × 1-based

| Convenção | Models | Uso |
|---|---|---|
| 0-based | `ContratoModel` e filhos, `EquipmentsModel`, `MarcasModel`, `PecasModel`, `UsuariosModel` | `linha[const]`; em `getRange` use `const + 1` |
| 1-based | `ChamadosModel`, `FornecedorModel`, `LocalizacaoModel`, `FuncionariosModel` | `getRange(l, const)`; no array use `linha[const - 1]` |

Antes de mexer em colunas, confira qual convenção o arquivo usa.

## Armadilhas conhecidas

- **Classes duplicadas:** `01-SheetModel.js` declara `class SheetModel` e `02-SheetModel.js` declara `class SheetModel2`. Os métodos estáticos de `SheetModel2` (`registerModel`, `getModel`, `readById`, `readContext`) ainda usam `SheetModel.modelsRegistry`, que não existe em `SheetModel`, e falham se forem chamados.
- **Planilha do `SheetModel`:** a classe base espera colunas 1-based, mas `EquipmentsModel` configura índices 0-based.
- **Arquivos fora do servidor:** o `clasp push` envia **todo** `.js`/`.html` da pasta. Arquivos auxiliares locais (scripts Node, backups) precisam ir para o `.claspignore` ou sair da pasta.
- **Ordem dos `include()`:** em `index.html`, uma função de cliente declarada depois sobrescreve a homônima declarada antes.

## Commits

- Commits pequenos, um assunto por commit.
- Quando o commit exige mudança na planilha (aba ou coluna nova), descreva a mudança na mensagem.
- Nunca faça commit de `.clasp.json`, que guarda o `scriptId`.
