# Diretrizes do Sistema — Gestão de Equipamentos e Peças (Google Apps Script)

Este projeto é um Web App SPA em **Google Apps Script (runtime V8, timezone `America/Sao_Paulo`)** sincronizado via `clasp`, usando **Google Sheets** como banco de dados e **Google Drive** para anexos.

## 1. Arquitetura e Organização de Pastas
- **Entry point (`Main.js`)**: `doGet()` renderiza `index.html` via `HtmlService.createTemplateFromFile('index').evaluate()`. Também contém gatilhos legados de planilha (`onEdit`, `executarAoEditar`).
- **Composição do SPA (`index.html`)**: Usa `<?!= include('caminho/sem_extensao') ?>` (helper `include()` em `Main.js`) para embutir todo CSS, HTML de páginas/modais e JS em uma única página.
  - Atenção à **ordem dos `include()`**: declarações posteriores no escopo global sobrescrevem funções homônimas anteriores (ex.: arquivos em `js/` carregados após `apps/Controller/`).
- **Camadas**:
  - `apps/01-Model/`: Definições de tabelas (`tbl_*`), constantes de colunas e funções `Read*()` usando `ReadSheet()` (`Model.js`) ou `SheetModel` (`01-SheetModel.js`). O prefixo `01-` garante ordem de carregamento no Apps Script antes das subclasses.
  - `apps/Controller/<Modulo>/`: Separado por módulo (`Chamados`, `Contrato`, `Dashboard`, `Equipments`, `Fornecedor`, `Marcas`, `Pecas`, `Relatorios`, `Usuarios`, além de `apps/Agenda*`). Normalmente dividido em `back/*.js` (servidor `.gs`) e `front/` ou `cadastro/`/`consulta/` (`*.html` para markup, `*CSS.html` e `*JS.html`).
  - `apps/Helper/`: Utilitários compartilhados — **não duplicar** helpers já centralizados (`HelperDate.js`, `AnexosBackend.js`, `EquipamentoBuscaBackend.js`, `HelperJS.html`, `AnexosCadastroJS.html`).
  - `js/` e `css/`: Infraestrutura SPA (`IndexSPAJS.html` com `trocarPagina()` / `voltarPagina()`), variáveis globais e estilos compartilhados.

## 2. Regras Críticas de Google Apps Script
1. **Escopo Global Único (Backend `.js`)**: Todos os arquivos `.js` compartilham o mesmo escopo global no Apps Script (sem `import`/`export`). Nunca crie funções ou variáveis globais com nomes duplicados entre arquivos. Use sufixo `_` (ex.: `helperLocal_()`) para funções auxiliares internas de backend.
2. **Serialização do `google.script.run`**:
   - **Nunca retorne objetos `Date` crus** dentro de objetos ou arrays para o cliente — o `google.script.run` falha silenciosamente e devolve `null`. Sempre converta `Date` para string (`dd/MM/yyyy` ou `dd/MM/yyyy HH:mm` via `Utilities.formatDate` / `dateToString` / `dateTimeToString`) antes de retornar.
   - No frontend, prefira `await runServerFunction('nomeFuncao', ...args)` (`apps/Helper/HelperJS.html`) ao encadear chamadas assíncronas com `async/await`.
3. **Templates HTML (`*.html`)**:
   - Arquivos `*JS.html` devem envolver o código em `<script>...</script>`.
   - Arquivos `*CSS.html` incluídos dentro de `<style>` no `index.html` contêm CSS puro (sem `<style>` interno).
   - Sempre sanitize strings interpoladas em `innerHTML` no cliente usando `escapeHtml()` (`apps/Helper/HelperJS.html`).

## 3. Convenções de Google Sheets e Models
1. **Estrutura das Abas (`tbl_*`)**: Linhas 1 e 2 são cabeçalho/metadados; **os dados começam na linha 3 (`firstLine = 3`)** nas tabelas atuais.
2. **Atenção rigorosa a Índices 0-based vs. 1-based**:
   - `ReadSheet()` retorna matriz 0-based (`linha[col]`). `sheet.getRange(linha, col)` exige coluna **1-based**.
   - **Models 0-based** (`EquipmentsModel`, `ContratoModel.js`, `MarcasModel.js`, `PecasModel.js`, `UsuariosModel.js`): suas constantes de coluna indexam arrays diretamente e exigem `col + 1` em `getRange()`.
   - **Models 1-based** (`ChamadosModel.js`, `FornecedorModel.js`, `LocalizacaoModel.js`, `FuncionariosModel.js`): suas constantes servem para `getRange()`, **não** para indexar diretamente o array de `ReadTickets()` / `ReadSuppliers()`.
   - **Armadilha conhecida**: `SheetModel` (`01-SheetModel.js`) espera colunas 1-based (faz `this.colDtExclusao - 1`), enquanto `EquipmentsModel` configura índices 0-based. Sempre verifique qual convenção o arquivo usa antes de alterar colunas ou `getRange()`.
3. **Exclusão Lógica (Soft Delete)**:
   - Registros não são apagados fisicamente: preenche-se a coluna de data de exclusão (`dd/MM/yyyy`) e pinta-se a linha de `#F4CCCC` (reativação limpa a célula e restaura `#FFFFFF`).
   - Consultas devem ordenar registros desativados por último (`(a.desativada ? 1 : 0) - (b.desativada ? 1 : 0)`).
4. **Anexos**:
   - Reutilize `adicionarAnexoGenerico`, `buscarAnexosGenerico` e `excluirAnexoGenerico` (`apps/Helper/back/AnexosBackend.js`) no servidor e `registrarCampoAnexoCadastro` (`apps/Helper/AnexosCadastroJS.html`, limite de 3 MB) no cliente.

## 4. Clasp e Segurança
- Nunca commite ou altere `.clasp.json` sem solicitação explícita (está listado no `.gitignore` e guarda `scriptId`s do projeto).
