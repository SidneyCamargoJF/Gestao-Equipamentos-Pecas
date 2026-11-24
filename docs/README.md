# Gestão de Equipamentos e Peças — Documentação

Sistema web interno para controlar o parque de equipamentos de climatização, as peças, os fornecedores e os contratos de manutenção, e para registrar e acompanhar chamados (corretivos e preventivos).

Roda como **Web App do Google Apps Script**. Os dados ficam numa **planilha Google** (uma aba por tabela) e os anexos, no **Google Drive**.

## Índice

| Documento | Para quem | Conteúdo |
|---|---|---|
| [01 — Visão geral](01-visao-geral.md) | todos | O que o sistema faz, módulos e fluxo de trabalho |
| [02 — Manual de uso](02-manual-de-uso.md) | usuários | Telas, campos e operações de cada módulo |
| [03 — Manutenção por contrato](03-manutencao-por-contrato.md) | gestores e desenvolvedores | Regras de SLA, preventivas automáticas, checklist e atrasos |
| [04 — Banco de dados](04-banco-de-dados.md) | desenvolvedores | Abas da planilha e suas colunas |
| [05 — Arquitetura](05-arquitetura.md) | desenvolvedores | Estrutura de pastas, camadas e fluxo de uma requisição |
| [06 — Guia de desenvolvimento](06-guia-de-desenvolvimento.md) | desenvolvedores | Convenções obrigatórias e armadilhas conhecidas |
| [07 — Implantação e operação](07-implantacao-e-operacao.md) | administradores | clasp, publicação, gatilhos e rotinas de manutenção |

## Resumo técnico

- **Plataforma:** Google Apps Script, runtime V8, fuso `America/Sao_Paulo` ([appsscript.json](../appsscript.json)).
- **Publicação:** Web App executado como o usuário que acessa (`USER_ACCESSING`), restrito ao domínio (`DOMAIN`).
- **Front-end:** SPA em HTML/CSS/JS puro servida por `HtmlService`. Chama o servidor com `google.script.run`.
- **Banco de dados:** Google Sheets. A linha 1 de cada aba guarda o índice, a linha 2 o cabeçalho e os dados começam na linha 3.
- **Versionamento e deploy:** git e [clasp](https://github.com/google/clasp).
