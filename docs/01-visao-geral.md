# 01 — Visão geral

## Objetivo

Centralizar, num só lugar, o controle de:

- **equipamentos** (aparelhos de ar-condicionado e similares), com patrimônio, localização e garantia;
- **peças** compradas, com nota fiscal e garantia;
- **fornecedores** (prestadores de serviço e distribuidores);
- **contratos** de manutenção, com os equipamentos cobertos, os serviços, o checklist preventivo e o SLA;
- **chamados**: os pedidos de manutenção corretiva abertos pelos usuários e as ordens de serviço (OS) preventivas geradas automaticamente a partir dos contratos.

## Módulos (menu)

| Menu | Página | O que faz |
|---|---|---|
| Dashboard | `dashboard` | Indicadores: manutenção do mês, chamados, contratos, equipamentos, peças e fornecedores |
| Cadastros → Marcas | `marcas-view` | Marcas usadas por equipamentos e peças |
| Cadastros → Equipamentos | `equipments-view` | Cadastro e consulta de equipamentos |
| Cadastros → Peças | `pecas-view` | Cadastro e consulta de peças |
| Contratos | `contratos-view` | Contratos de manutenção e seus dados vinculados |
| Fornecedores | `fornecedor-view` | Cadastro de fornecedores |
| Chamados | `chamado-view` | Abertura, consulta e acompanhamento de chamados e OS |
| Agenda | `agenda` | Calendário com chamados, preventivas, vencimentos de contrato e de garantias de peças |
| Relatórios | `relatorios` | Relatório do checklist preventivo por contrato |
| Configuração | `configuracoes` | Usuários do sistema |

## Fluxo de trabalho típico

```
Fornecedor ──► Contrato ──► equipamentos cobertos
                  │          serviços (preventiva/corretiva)
                  │          checklist (itens + periodicidade)
                  │          SLA por prioridade
                  ▼
     ┌────────────┴─────────────┐
     │                          │
Chamado corretivo          OS preventiva (automática, todo mês)
aberto pelo usuário        gerada pelo gatilho diário
     │                          │
     │  contrato + prazos SLA   │  itens de checklist por equipamento
     ▼                          ▼
Em Andamento ──► Concluído   execução do checklist ──► Concluído
                                  │
                                  └─ item "não conforme" ──► abre corretiva
```

1. Cadastram-se **fornecedores**, **marcas** e **equipamentos**.
2. Cadastra-se o **contrato**: vigência, equipamentos cobertos, serviços, itens do checklist com sua periodicidade e SLA por prioridade.
3. Quando alguém abre um **chamado corretivo** informando o patrimônio ou a localização, o sistema:
   - encontra o equipamento;
   - descobre o contrato vigente que o cobre;
   - atribui o chamado à empresa do contrato;
   - calcula os prazos de atendimento e de solução pelo SLA.
4. Todo dia às 06h um gatilho gera, para cada contrato com serviço preventivo, a **OS preventiva do mês**. A OS traz os itens de checklist devidos naquele mês para cada equipamento coberto.
5. O técnico ou gestor registra o resultado de cada item na própria OS. Um item **não conforme** pode virar um chamado corretivo com um clique.
6. O **Dashboard**, a **Consulta de Chamados** (filtro "Só atrasados") e a **Agenda** mostram o que está pendente ou atrasado.

## Conceitos

| Termo | Significado |
|---|---|
| Chamado | Registro em `tbl_chamados`. O tipo pode ser corretiva, preventiva, instalação, limpeza, desinstalação ou outro. |
| OS preventiva | Chamado do tipo `preventiva` e origem `automatica`, criado pelo sistema. Há uma por contrato por mês. |
| Competência | Mês de referência de uma OS preventiva, no formato `AAAA-MM`. |
| Data base preventiva | Data do contrato a partir da qual a periodicidade dos itens é contada. Na falta dela, usa-se a data inicial do contrato. |
| SLA | Prazos, em horas, de atendimento e de solução por prioridade (baixa, média, alta, urgente). Podem ser contados em horas corridas ou só em horas úteis. |
| Exclusão lógica | Nada é apagado da planilha. O registro recebe uma data de exclusão e a linha fica vermelha (`#F4CCCC`). |
