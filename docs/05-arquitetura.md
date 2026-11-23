# 05 — Arquitetura

## Visão de execução

```
Navegador (SPA)                       Google Apps Script (servidor)            Google
──────────────────                    ─────────────────────────────            ──────
index.html (montado 1x) ── doGet() ──► Main.js → HtmlService.include(...)
   │
   │ runServerFunction('fn', args)    apps/Controller/**/back/*.js
   └──── google.script.run ─────────► função global fn(...)
                                          │ Read*() / proximoIdTabela / executarComLock
                                          ▼
                                      apps/01-Model/*.js ── ReadSheet ──────► Planilha (tbl_*)
                                      apps/Helper/back/AnexosBackend.js ─────► Drive (anexos)
                         ◄── { sucesso, mensagem, ... } (sem Date)
```

- **Montagem da página:** [Main.js](../Main.js) serve `index.html` em `doGet()`. O [index.html](../index.html) reúne todos os CSS, páginas, modais e scripts com `<?!= include('caminho') ?>`. O resultado é uma página única.
- **Troca de página:** é feita no cliente por `trocarPagina(id)` e `voltarPagina()`, em [js/IndexSPAJS.html](../js/IndexSPAJS.html).
- **Chamadas ao servidor:** o cliente usa `await runServerFunction('nome', ...args)`, em [apps/Helper/HelperJS.html](../apps/Helper/HelperJS.html), que encapsula `google.script.run`.
- **Identidade:** o Web App roda **como o usuário que acessa**. Cada usuário precisa de permissão na planilha e na pasta de anexos do Drive. O e-mail vem de `Session.getActiveUser()`.

## Pastas

```
Main.js, index.html, MainMenu.html, Pages.html   entrada, montagem e menu
appsscript.json                                  manifesto (fuso, runtime, webapp)
css/                                             estilos globais (*CSS.html)
js/                                              infraestrutura da SPA (navegação, estado, CRUD genérico)
apps/
  01-Model/                                      acesso à planilha: constantes de colunas e Read*()
    Model.js                                     ReadSheet, ReadSheetSeExistir, FindContext...
    01-SheetModel.js                             classe base SheetModel (usada por EquipmentsModel)
    02-SheetModel.js                             SheetModel2 (versão nova, em desenvolvimento)
    <Entidade>Model.js                           um arquivo por aba
  Controller/<Modulo>/
    back/*.js                                    funções de servidor do módulo
    cadastro/ | consulta/ | front/               *.html (markup), *CSS.html, *JS.html
  Helper/
    back/                                        utilitários de servidor (datas, lock, anexos, periodicidade)
    HelperJS.html, AnexosCadastroJS.html         utilitários de cliente
  Modal/                                         modal de detalhes do chamado
  Agenda*.{js,html}                              módulo Agenda
docs/                                            esta documentação
xOld-Apps/                                       código antigo, não usado
```

## Módulos e arquivos de servidor

| Módulo | Arquivos `back/` | Funções principais |
|---|---|---|
| Chamados | `CadastroChamadoBackend.js` | `salvarChamadoBackend`, `buscarChamadoParaEdicao`, `adicionarHistoricoSistema(Lote)`, `adicionarAnexoChamado` |
| | `ConsultaChamadoBackend.js` | `filtrarChamados`, `buscarChamadoDetalhado`, `alterarStatusChamado`, `desativarChamado`, `reativarChamado`, anotações |
| | `ChamadoContratoBackend.js` | `buscarContratoVigentePorEquipamento`, `calcularPrazosChamado`, `avaliarAtrasoChamado`, `listarEquipamentosPorLocalizacao`, `verificarPatrimonioChamado`, `listarContratosParaFiltro` |
| | `ChamadoChecklistBackend.js` | `buscarChecklistChamado`, `salvarChecklistChamado`, `contarPendentesChecklistChamado`, `abrirCorretivaItemChecklist` |
| | `PreventivasBackend.js` | `gerarPreventivasDoMes`, `gerarPreventivasDoMesManual`, `instalarGatilhoPreventivas`, `usuarioEhAdmin` |
| | `MigracaoChamadosBackend.js` | `preencherCamposNovosChamados` (rotina de uso único) |
| Contratos | `CadastroContratoBackend.js` | `salvarContratoBackend`, `buscarContratoParaEdicao`, `salvar{Equipamentos,Servicos,Produtos,Checklist,Sla}Contrato`, `proximoIdTabela` |
| | `ConsultaContratoBackend.js` | `filtrarContratos`, `desativarContrato`, `reativarContrato` |
| Equipamentos | `EquipmentsController.js` | `filtrarEquipamentos`, `salvarEquipamento`, `buscarEquipamentoDetalhado`, desativar/reativar |
| Peças | `CadastroPeca.js`, `ConsultaPeca.js` | `salvarPeca`, `FiltrarPecas`, desativar/reativar |
| Fornecedores | `CadastroFornecedorBackend.js`, `ConsultaFornecedorBackend.js` | `salvarFornecedorBackend`, `verificarCnpjExistente`, `filtrarFornecedores` |
| Marcas | `ConsultaMarcaFormHtml.js` | `filtrarMarcas`, `cadastrarMarca`, `editarMarca` |
| Usuários | `UsuariosBackend.js` | `filtrarUsuarios`, `cadastrarUsuario`, `buscarUsuarioLogado`, `nomeUsuarioLogado` |
| Dashboard | `DashboardBackend.js` | `buscarIndicadores{Manutencao,Chamados,Contratos,Equipamentos,Pecas,Fornecedor}` |
| Agenda | `apps/AgendaBackend.js` | `buscarEventosAgenda(ano, mes)` |
| Relatórios | `RelatoriosBackend.js` | `fillContracts`, `buscarRelatorioChecklist` |

## Helpers de servidor

| Arquivo | Conteúdo |
|---|---|
| `HelperDate.js` | `dateToString`, `dateTimeToString`, `stringToDate`, `parseDataFlex` (aceita Date, `dd/MM/yyyy [HH:mm]` e ISO), `inicioDoDia`, `somarHorasPrazo` |
| `HelperLock.js` | `executarComLock(fn, timeoutMs)`: `LockService` reentrante com `flush` no fim |
| `HelperPeriodicidade.js` | `PERIODICIDADES`, `normalizarPeriodicidade`, `lerItemChecklistContrato`, `migrarPeriodicidadeChecklist` |
| `AnexosBackend.js` | `adicionarAnexoGenerico`, `buscarAnexosGenerico`, `excluirAnexoGenerico` (Drive com hash para detectar duplicados) |
| `EquipamentoBuscaBackend.js` | busca de equipamento por patrimônio, nome, especificação e localização |

## Fluxo de uma gravação (exemplo: abrir chamado)

1. O formulário monta `dados` e chama `runServerFunction('salvarChamadoBackend', dados)`.
2. `salvarChamadoBackend` entra em `executarComLock`, que serializa a geração de ID.
3. O servidor identifica o equipamento, depois o contrato vigente, e calcula os prazos de SLA.
4. `proximoIdTabela` devolve o novo ID e a próxima linha. A linha inteira (21 colunas) é gravada com um único `setValues`.
5. `adicionarHistoricoSistema` registra a abertura e o vínculo com o contrato.
6. O servidor devolve `{ sucesso, mensagem, id, ... }` e a tela mostra a mensagem.
