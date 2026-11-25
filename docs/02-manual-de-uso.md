# 02 — Manual de uso

Navegação: o menu superior troca de página sem recarregar. O botão **Voltar** retorna à página anterior.

**Sair sem salvar:** nos cadastros e edições (chamado, contrato, equipamento, fornecedor e peça), se você alterou algum dado e tenta sair sem salvar (menu, Voltar, Cancelar ou fechar a aba), o sistema avisa e pergunta: **Continuar editando** mantém você na tela com o que digitou; **Sair sem salvar** descarta as alterações. Campos de busca não contam como alteração. Depois de salvar, a saída é direta.

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
| 🛠️ Serviços | Tipo de manutenção (Preventiva/Corretiva), periodicidade, **valor unitário** (R$ por equipamento, editável também no card do serviço) e a especificação do equipamento em cascata: **categoria → capacidade → tipo**, só com o que existe em equipamentos cadastrados (com um tipo só, ele já vem escolhido). Ao confirmar, aparece "Processando" enquanto os equipamentos da especificação são buscados e incluídos na aba Equipamentos; a mensagem informa quantos entraram e quantos já estavam no contrato |
| 🔧 Equipamentos | Equipamentos cobertos pelo contrato |
| 📦 Produtos | Produtos ou peças previstos |
| ✅ Checklist | Itens do checklist preventivo, por equipamento. Um formulário só: escolha a **categoria** e o **tipo** do equipamento (em cascata, como no serviço; "Todos os tipos" vale para a categoria inteira), digite a **etapa**, escolha a **periodicidade** (mensal, bimestral, trimestral, quadrimestral, semestral ou anual) e clique em **Adicionar** (ou Enter). Categoria e tipo ficam escolhidos para lançar várias etapas seguidas. Os itens aparecem na lista logo abaixo (categoria, tipo, descrição, período), com editar e remover em cada linha. No chamado preventivo, cada equipamento recebe só os itens da sua categoria/tipo; itens antigos sem categoria valem para todos |
| ⏱️ SLA | Para cada prioridade: prazo de atendimento (h), prazo de solução (h) e se conta só horas úteis |

Um contrato só gera chamados preventivos se tiver um serviço do tipo **Preventiva** e itens de checklist. Detalhes no documento [03](03-manutencao-por-contrato.md).

## Chamados

### Abrir um chamado

A tela tem o bloco **Dados do Chamado** e, abaixo, três abas: **Vínculo Contratual e Planejamento**, **Equipamentos** e **Serviço**.

- As abas ficam **desabilitadas até o Tipo ser escolhido** em Dados do Chamado.
- A tela sempre abre na aba Vínculo.
- O rótulo da aba Equipamentos mostra quantos equipamentos estão na lista.
- Se faltar equipamento ao salvar, a tela vai direto para essa aba.

**Dados do Chamado:**
- **Tipo, Assunto e Classificação (prioridade).** A prioridade pode ser baixa, média, alta ou urgente.
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

**Ao salvar** (botão **Salvar**, na abertura e na edição), o chamado guarda a lista de equipamentos. Sem contrato escolhido, o sistema procura o contrato vigente do primeiro equipamento da lista e calcula os prazos de SLA. Depois de salvo, aparece a confirmação com o botão **Enviar e-mail para a empresa** (veja [E-mail para a empresa](#e-mail-para-a-empresa)).

### Consultar

**Filtros:**
- ID, tipo, assunto, status e período;
- **Contrato**;
- **Origem:** manual ou automática;
- **Só atrasados**.

Nas **preventivas**, as colunas Equipamento e Localização mostram **Diversos**, porque o chamado cobre vários equipamentos. Mesmo assim, o filtro de equipamento encontra a preventiva quando o patrimônio digitado está na lista do chamado ou no checklist do chamado.

Os chamados atrasados recebem o selo **Atrasado**. Ao passar o mouse sobre ele, aparece o motivo do atraso.

O botão **Gerar preventivas do mês** gera manualmente os chamados preventivos da competência atual. Se a propriedade `ADMINS` estiver configurada, só os administradores podem usá-lo. Veja o documento [07](07-implantacao-e-operacao.md).

### Detalhes do chamado (modal)

- **Informações do Chamado:** dados, contrato, origem, competência, data prevista e prazos, e o botão **Enviar e-mail para a empresa**.
- **Equipamento / Equipamentos:** aba logo depois de Informações do Chamado.
  - **Preventiva:** a aba se chama "Equipamentos (N)" e traz a tabela com todos os equipamentos do chamado (lista do chamado e checklist): patrimônio, equipamento, capacidade, localização, estado e, se houver, a observação de encerramento.
  - **Demais tipos:** a aba se chama "Equipamento" e mostra só o equipamento do chamado (patrimônio, nome, marca, modelo, capacidade, localização e estado).
- **Movimentações:**
  - histórico automático, com linhas prefixadas por `[SISTEMA]`;
  - anotações livres, que podem ser editadas e excluídas.
- **Checklist:** aparece só em chamado com itens.
  - Para cada item e equipamento: resultado (pendente, ok, não conforme ou não aplicável) e observação.
  - Ao salvar, gravam-se a data/hora e o usuário que registrou.
  - Num item **não conforme**, o botão **Abrir corretiva** cria um chamado corretivo para o equipamento, já vinculado ao mesmo contrato. Ele não deixa abrir duas corretivas para o mesmo item.

### Status

`Aberto` → `Em Andamento` (grava a data de início do andamento) → `Concluido` (grava a data de finalização).

- Para concluir é obrigatório informar o motivo.
- Ao clicar em Resolver, os botões Resolver e Adicionar anotação somem; o campo do motivo fica menor, com **Cancelar** e **Confirmar encerramento** à direita dele.
- **Preventiva:** ao clicar em Resolver, aparece também a **observação por patrimônio** (opcional).
  1. Digite o patrimônio. O sistema procura entre os equipamentos do chamado (lista e checklist) e mostra, na frente do campo, a descrição do equipamento para conferência: nome/modelo, marca, capacidade, localização e estado. Patrimônio fora do chamado não é aceito. Se o chamado tiver **um equipamento só**, o patrimônio já vem preenchido e conferido: basta digitar a observação.
  2. Digite a observação e clique em **Incluir** (ou tecle Enter).
  3. Abaixo aparece a lista dos equipamentos incluídos com a observação de cada um. Em cada linha há os botões **Alterar** (carrega a observação para editar; o botão passa a ser "Salvar alteração") e **Excluir**.
  - Um patrimônio só entra uma vez na lista; para mudar, use Alterar.
  - Se houver patrimônio ou observação digitados e não incluídos, o encerramento pede para incluir ou limpar antes de confirmar.
  - As observações ficam gravadas por equipamento e registradas no histórico. Excluir da lista uma observação já gravada apaga essa observação.
  - Se o chamado for reaberto e resolvido de novo, as observações anteriores já aparecem na lista.
- Se o chamado ainda tiver itens de checklist pendentes, o motivo informado fica no histórico como justificativa das pendências.
- **Desativar** marca o chamado como `Cancelado`. **Reativar** desfaz.

### E-mail para a empresa

Abre pelo botão **Enviar e-mail para a empresa**, na confirmação depois de salvar o chamado ou nos detalhes do chamado.

**Reenviar e-mail:** na edição do chamado, o botão **📧 Reenviar e-mail** abre a mesma tela já com o último e-mail enviado pelo sistema para esse chamado (destinatários, cópia, assunto e mensagem), com a data e quem enviou. Dá para alterar antes de enviar de novo. Se nenhum e-mail foi guardado ainda, a tela abre em branco para escrever. O e-mail usa os dados já salvos do chamado: com alterações não salvas, o sistema pergunta antes.

- **Para:** vem com o e-mail do contrato (ou do fornecedor, se o contrato não tiver). Pode ser alterado; vários e-mails são separados por `;`. **Cópia** é opcional.
- **Modelo:** escolha um modelo para preencher o assunto e a mensagem com os dados do chamado (número, assunto, equipamentos, contrato, empresa, prazos etc.). O texto continua editável antes de enviar. Sem modelo, digite o e-mail.
- **Salvar como modelo:** guarda o assunto e a mensagem digitados como um modelo novo. Os dados do chamado (número, empresa, contrato, equipamentos...) voltam a ser campos, para servir a outros chamados; confira e dê um nome antes de salvar.
- **Enviar:** o e-mail sai pela sua conta Google, fica registrado nas Movimentações do chamado e é guardado para o Reenviar.

## Agenda

Calendário mensal com os eventos abaixo.

Os botões **Calendário** e **Lista por dia** trocam a visão. A lista mostra os eventos do mês em sequência, separados por dia (data, dia da semana e quantidade); dias sem evento não aparecem. Clicar num evento abre o registro. O sistema lembra a última visão escolhida.

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

O menu **Relatórios** abre um submenu com um item por relatório: **Checklist** e **Manutenção das preventivas**. O relatório escolhido aparece no título da página.

**Checklist:** os itens do checklist do contrato agrupados por **categoria e tipo de equipamento** e, dentro, por periodicidade. Na impressão, cada categoria/tipo começa numa página nova, com o contrato no topo.

**Manutenção das preventivas (conferência da NF):** escolha o contrato, a competência ou os dois. Sem contrato ("Todos os contratos"), saem todos os contratos daquela competência; sem competência, todas as competências do contrato.

- **Uma seção por contrato e competência**, com a empresa e os chamados considerados (com o status de cada um).
- **Tabela principal:** uma linha por serviço (categoria, tipo e capacidade), com quantidade de equipamentos atendidos, valor unitário e valor total, e uma linha de **Total** no fim.
- **Equipamento atendido:** tem item do checklist marcado como OK ou Não conforme, ou está num chamado **concluído** (mesmo que o checklist não tenha sido marcado). Só fica de fora do chamado concluído o equipamento com todos os itens marcados como N/A.
- **Equipamentos sem preventiva executada:** ficam numa tabela separada, com o chamado e o motivo, e não entram no valor.
- **Observações por equipamento:** os equipamentos que receberam observação no chamado: a observação digitada para o patrimônio ao resolver (sem rótulo) e as dos itens do checklist (com a descrição do item). Quem não teve a preventiva executada aparece marcado.
- **Resolução do chamado:** logo depois, o texto informado ao concluir o chamado. Se o chamado foi reaberto e concluído de novo, vale o mais recente.
- **Total geral:** quando há mais de uma seção, um quadro no fim soma todas.
- **Avisos:** a linha mostra "sem serviço no contrato" quando a especificação do equipamento não bate com nenhum serviço Preventiva, e "sem valor unitário" quando o serviço não tem valor. Essas linhas não entram no total.

Use **Imprimir** para gerar a versão em papel ou PDF. As regras estão no documento [03](03-manutencao-por-contrato.md#7-manutenção-das-preventivas).

## Configuração

O menu **Configuração** tem dois itens: **Usuários** e **Modelos de e-mail**.

### Configuração → Modelos de e-mail

Lista os modelos usados no [e-mail para a empresa](#e-mail-para-a-empresa), com **Alterar** e **Excluir** em cada linha e o botão **+ Novo modelo**.

- Cada modelo tem nome (não pode repetir), assunto e mensagem.
- Os botões de **Campos do chamado** inserem, onde está o cursor, marcadores como `{{numero_chamado}}` ou `{{empresa}}`. No envio, eles viram os dados do chamado.
- Na primeira vez, o sistema cria cinco modelos: solicitação de atendimento, cobrança de prazo de atendimento, cobrança de prazo de solução, agendamento e solicitação de atualização.

### Configuração → Usuários

**Campos:** matrícula, **usuário** (login Google, a parte antes do `@`), nome, lotação e setor.

- O login não pode se repetir.
- O sistema identifica quem está usando pelo e-mail da conta Google. O **nome** cadastrado é o que aparece em "Aberto por" e no registro do checklist.
- Quem não está cadastrado aparece como "Desconhecido".
