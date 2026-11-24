# 02 — Manual de uso

Navegação: o menu superior troca de página sem recarregar. O botão **Voltar** retorna à página anterior.

Padrões das consultas:

- **Filtros e lista:** cada consulta tem filtros no topo e a lista de resultados abaixo. Os registros desativados aparecem por último, com fundo vermelho.
- **Desativar e reativar:** os registros não são apagados. Desativar grava a data de exclusão; reativar limpa essa data.
- **Detalhes:** a lupa ou o clique na linha abre um modal com os detalhes do registro.

## Equipamentos

**Campos:**
- nome, marca, capacidade e modelo;
- patrimônio e sequência;
- localização, fornecedor e **estado** (Novo, Bom, Ruim, Péssimo ou Velho);
- data de entrada, nota fiscal, processo SEI, data de garantia, valor e observações.

**Regras:**
- O **patrimônio** identifica o equipamento na abertura de chamados.
- A situação da garantia (vigente ou vencida) é calculada pela data de garantia.
- O **estado** aparece numa coluna da consulta, que pode ser ordenada na sequência Novo → Velho, e nos detalhes do equipamento. Aparece também na lista de equipamentos do chamado.

## Peças

**Campos:**
- nome, marca, modelo, capacidade e número de série;
- local e fornecedor;
- nota fiscal (número e data) e garantia (prazo e data final);
- modalidade, valor e processo SEI.

As peças com garantia vencendo aparecem na **Agenda**.

## Marcas

Cadastro simples (nome), usado nos cadastros de equipamentos e peças.

## Fornecedores

**Campos:**
- tipo: prestador de serviço e/ou distribuidor de produtos;
- razão social, nome fantasia, CNPJ e inscrições estadual e municipal;
- e-mail, telefone, celular e WhatsApp;
- endereço completo.

O CNPJ não pode se repetir.

O campo **Empresa** do contrato é preenchido a partir do fornecedor. Por isso o sistema reconhece o fornecedor de um chamado comparando esse campo com a razão social ou com o nome fantasia.

## Contratos

O cadastro tem os dados principais e seis abas:

**Dados principais:**
- identificação: número, nome, processo SEI, empresa (fornecedor) e objeto;
- valores e datas: valor, data inicial, data final e data de fechamento;
- contato: contato da empresa, telefone, e-mail e gestor;
- situação, data de encerramento e **data base preventiva**.

Ao preencher a data inicial, a data base preventiva é sugerida com o mesmo valor.

| Aba | Conteúdo |
|---|---|
| 📋 Complementares | Observações e anexos (contrato, aditivos etc.) |
| 🛠️ Serviços | Tipo de manutenção (Preventiva/Corretiva), categoria, tipo, capacidade, periodicidade e **valor unitário** (R$ por equipamento, editável também no card do serviço) |
| 🔧 Equipamentos | Equipamentos cobertos pelo contrato |
| 📦 Produtos | Produtos ou peças previstos |
| ✅ Checklist | Itens do checklist preventivo. Cada item tem uma **periodicidade**: mensal, bimestral, trimestral, quadrimestral, semestral ou anual |
| ⏱️ SLA | Para cada prioridade: prazo de atendimento (h), prazo de solução (h) e se conta só horas úteis |

Um contrato só gera OS preventivas se tiver um serviço do tipo **Preventiva** e itens de checklist. Detalhes no documento [03](03-manutencao-por-contrato.md).

## Chamados

### Abrir um chamado

A tela tem o bloco **Dados do Chamado** e, abaixo, três abas: **Vínculo Contratual e Planejamento**, **Equipamentos** e **Serviço**.

- As abas ficam **desabilitadas até o Tipo ser escolhido** em Dados do Chamado.
- A tela sempre abre na aba Vínculo.
- O rótulo da aba Equipamentos mostra quantos equipamentos estão na lista.
- Se faltar equipamento ao salvar, a tela vai direto para essa aba.

**Dados do Chamado:**
- **Tipo, Motivo e Classificação (prioridade).** A prioridade pode ser baixa, média, alta ou urgente.
- **Aberto por:** preenchido automaticamente com o usuário logado, sem edição.
- **Descrição.**

**Aba Vínculo Contratual e Planejamento:**
- **Contrato:** busca por número ou SEI.
  - **Em chamado do tipo Preventiva, ao escolher um contrato, todos os equipamentos vinculados a ele entram na lista de equipamentos.** Nos outros tipos, os equipamentos são adicionados à mão.
  - Se você trocar de contrato, saem os equipamentos que o contrato anterior incluiu, e os adicionados à mão ficam.
  - Mudar o tipo para Preventiva com contrato já escolhido inclui os equipamentos dele. Mudar para outro tipo retira os que o contrato incluiu.
  - Se o contrato estiver vazio, ele é sugerido pelo primeiro equipamento adicionado pelo patrimônio. A sugestão não inclui os outros equipamentos do contrato.
- **Competência e data prevista.**
- **Prazos de SLA:** prévia calculada pelo contrato e pela classificação.

**Aba Equipamentos** (pelo menos um é obrigatório; aceita vários):
- **Patrimônio:** digite o patrimônio. Quando o equipamento for encontrado, clique em **Adicionar** ou tecle Enter.
- **Localização:** escolha a localização para ver os equipamentos dela. Depois clique em **Adicionar** (o selecionado) ou **Adicionar todos**.
- **Lista:** mostra patrimônio, equipamento, marca, modelo, capacidade e localização. Cada linha tem o botão de remover, e **Remover todos** limpa a lista.

**Aba Serviço:**
- **Atribuído a:** recebe a empresa assim que o contrato é escolhido ou sugerido.
  - Se trocar de contrato, troca junto. Se apagar o contrato, o campo é limpo.
  - O que for digitado à mão não é substituído.
  - Se o campo for salvo vazio, o servidor grava a empresa do contrato.
- **Anexos:** relatórios e notas fiscais, com até 3 MB por arquivo.

**Ao salvar**, o chamado guarda a lista de equipamentos. Sem contrato escolhido, o sistema procura o contrato vigente do primeiro equipamento da lista e calcula os prazos de SLA.

### Consultar

**Filtros:**
- ID, tipo, motivo, status e período;
- **Contrato**;
- **Origem:** manual ou automática;
- **Só atrasados**.

Os chamados atrasados recebem o selo **Atrasado**. Ao passar o mouse sobre ele, aparece o motivo do atraso.

O botão **Gerar preventivas do mês** gera manualmente as OS da competência atual. Se a propriedade `ADMINS` estiver configurada, só os administradores podem usá-lo. Veja o documento [07](07-implantacao-e-operacao.md).

### Detalhes do chamado (modal)

- **Informações do Chamado:** dados, contrato, origem, competência, data prevista e prazos.
- **Movimentações:**
  - histórico automático, com linhas prefixadas por `[SISTEMA]`;
  - anotações livres, que podem ser editadas e excluídas.
- **Checklist:** aparece só em OS com itens.
  - Para cada item e equipamento: resultado (pendente, ok, não conforme ou não aplicável) e observação.
  - Ao salvar, gravam-se a data/hora e o usuário que registrou.
  - Num item **não conforme**, o botão **Abrir corretiva** cria um chamado corretivo para o equipamento, já vinculado ao mesmo contrato. Ele não deixa abrir duas corretivas para o mesmo item.

### Status

`Aberto` → `Em Andamento` (grava a data de início do andamento) → `Concluido` (grava a data de finalização).

- Para concluir é obrigatório informar o motivo.
- **Preventiva:** ao clicar em Resolver, aparece também a lista dos equipamentos da OS, com um campo de **observação por patrimônio** (opcional).
  - Equipamentos da lista do chamado e do checklist entram na lista.
  - As observações preenchidas ficam gravadas por equipamento e registradas no histórico.
  - Se o chamado for reaberto e resolvido de novo, as observações anteriores voltam preenchidas para edição.
- Se a OS ainda tiver itens de checklist pendentes, o motivo informado fica no histórico como justificativa das pendências.
- **Desativar** marca o chamado como `Cancelado`. **Reativar** desfaz.

## Agenda

Calendário mensal com os eventos abaixo.

| Evento | Data usada |
|---|---|
| Chamado | data de abertura |
| Preventiva | data prevista (último dia do mês da competência) |
| Contrato | data final de contratos ativos e não encerrados |
| Peça | data final da garantia |

## Dashboard

As seções têm botão de exportação em CSV.

### Manutenção do mês

- **Indicadores:** preventivas da competência atual, percentual de itens de checklist executados, preventivas atrasadas e corretivas fora do prazo.
- **Painéis:**
  - situação das preventivas;
  - lista das corretivas com SLA vencido;
  - ranking dos equipamentos com mais corretivas nos últimos 12 meses.
- **Atalhos:** clicar num indicador abre a Consulta de Chamados já filtrada. Clicar num item da lista abre o chamado.

### Demais seções

Chamados, Contratos (vigentes, vencendo em 30 dias, vencidos, encerrados), Equipamentos, Peças e Fornecedores.

## Relatórios

**Checklist:** os serviços do contrato e os itens do checklist agrupados por periodicidade.

**Medição das preventivas (conferência da NF):** escolha o contrato e a competência.

- **Tabela principal:** uma linha por serviço (categoria, tipo e capacidade), com quantidade de equipamentos atendidos, valor unitário e valor total, e uma linha de **Total** no fim.
- **Equipamentos sem preventiva executada:** ficam numa tabela separada e não entram no valor.
- **Avisos:** a linha mostra "sem serviço no contrato" quando a especificação do equipamento não bate com nenhum serviço Preventiva, e "sem valor unitário" quando o serviço não tem valor. Essas linhas não entram no total.

Use **Imprimir** para gerar a versão em papel ou PDF. As regras estão no documento [03](03-manutencao-por-contrato.md#7-medição-das-preventivas).

## Configuração → Usuários

**Campos:** matrícula, **usuário** (login Google, a parte antes do `@`), nome, lotação e setor.

- O login não pode se repetir.
- O sistema identifica quem está usando pelo e-mail da conta Google. O **nome** cadastrado é o que aparece em "Aberto por" e no registro do checklist.
- Quem não está cadastrado aparece como "Desconhecido".
