# 02 — Manual de uso

Navegação: o menu superior troca de página sem recarregar. O botão **Voltar** retorna à página anterior. Ordem do menu: Dashboard, Chamados, Estoque, Garantias, Compras, Agenda, Relatórios, Cadastros e Configuração.

**Sair sem salvar:** nos cadastros e edições (chamado, contrato, equipamento, fornecedor e peça), se você alterou algum dado e tenta sair sem salvar (menu, Voltar, Cancelar ou fechar a aba), o sistema avisa e pergunta: **Continuar editando** mantém você na tela com o que digitou; **Sair sem salvar** descarta as alterações. Campos de busca não contam como alteração. Depois de salvar, a saída é direta.

**Caixas de seleção com busca:** nas caixas de seleção com muitas opções (fornecedor, marca, localização, item, contrato...), ao clicar na seta abre uma lista com **campo de busca** (sem diferenciar acentos e maiúsculas). Use ↑/↓ e Enter para escolher e Esc para fechar.

Padrões das consultas:

- **Filtros e lista:** cada consulta tem filtros no topo e a lista de resultados abaixo. Os registros desativados aparecem por último, com fundo vermelho.
- **Itens por página:** abaixo da lista, escolha quantos itens exibir (10, 20, 50 ou 100; padrão 10) e navegue com « ‹ › », vendo "1–10 de 57" e a página atual. A escolha fica guardada no navegador para cada lista. Uma nova consulta volta à página 1. Vale para chamados, contratos, equipamentos, fornecedores, marcas, localizações, peças e produtos, garantias, notas fiscais, produtos x fornecedores, estoque, movimentações, usuários e modelos de e-mail.
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

## Peças e produtos

O cadastro **Cadastros → Peças e Produtos** guarda peças e produtos adquiridos. O saldo de cada item fica no menu [Estoque](#estoque). O campo **Tipo** (Peça / Produto) separa os dois; itens antigos, sem tipo, contam como peça.

**Campos:**
- tipo, nome, marca, modelo, capacidade e número de série;
- local e fornecedor;
- nota fiscal (número e data) e garantia (prazo e data final);
- modalidade, valor e processo SEI.

As peças com garantia vencendo aparecem na **Agenda**.

**Aquisições (notas fiscais):** as notas lançadas em **Compras → Notas fiscais** entram aqui sozinhas para os itens relacionados. No fim do cadastro, o grupo **Compras e fornecedores** tem duas abas. A aba **🧾 Aquisições** guarda cada compra do mesmo item, que pode ter sido adquirido em épocas e de fornecedores diferentes: **nº da nota**, **fornecedor**, **data de aquisição** e o **arquivo da nota** (PDF ou imagem, até 3 MB). Inclua e exclua na própria lista; a gravação é na hora (não precisa clicar em Salvar). Num item novo, salve primeiro.

**Fornecedores do item:** a aba **🏭 Fornecedores** mostra os fornecedores deste item e o **código** que cada um usa para ele (com a descrição como vem na nota). É a mesma relação de **Compras → Produtos x fornecedores**, usada para relacionar sozinho os itens do XML da NF-e. Escolha o fornecedor (já vem sugerido o do item), informe o código e clique em **Incluir**; 🗑️ exclui. A gravação também é na hora, e num item novo é preciso salvar primeiro. As abas mostram a quantidade entre parênteses.

**Consulta:** filtro e coluna **Tipo**. Em cada linha, o botão 🛡️ abre a garantia do item (veja [Garantias](#garantias)): fica ativo quando a garantia está vigente; com uma garantia em andamento, ele abre essa garantia; com a garantia vencida, sem data ou item desativado, fica apagado.

## Garantias

Item **Garantias** na barra de menu principal. Controla o acionamento da garantia de uma peça ou produto que deu defeito. Na consulta, os botões **Limpar**, **+ Abrir garantia** e **Consultar** ficam à direita do título.

### Abrir uma garantia

- Pelo botão 🛡️ na consulta de peças, ou por **+ Abrir garantia** na tela de Garantias (busque o item pelo nome, modelo ou número de série).
- Só abre com a garantia do item **vigente** (data final igual ou posterior a hoje) e sem outra garantia em andamento para o mesmo item.
- Informe o **defeito** (obrigatório) e, se quiser, o **prazo de resposta** do fornecedor.
- Depois de aberta, a confirmação oferece **Enviar e-mail ao fornecedor**.

### Andamento

| Status | Como chega |
|---|---|
| Aberta | ao abrir |
| Enviada ao fornecedor | **Marcar como enviada** (com protocolo e prazo, opcionais) ou ao enviar o e-mail ao fornecedor com a garantia ainda Aberta |
| Em análise | **Em análise**, depois de enviada |
| Atendida | **Encerrar** escolhendo troca, reparo ou reembolso |
| Negada | **Encerrar** escolhendo "Negada pelo fornecedor" (motivo obrigatório) |
| Cancelada | **Cancelar garantia** (motivo obrigatório), antes de encerrar |

- **Protocolo / prazo** altera o protocolo do fornecedor e o prazo de resposta enquanto a garantia não está encerrada.
- **Reabrir** volta uma garantia Atendida ou Negada para Em análise (motivo obrigatório).
- Com o prazo de resposta vencido e a garantia em andamento, ela aparece como **Atrasada** (em vermelho, no topo da lista).
- **Anexos:** laudo, fotos, nota fiscal ou outro documento (até 3 MB por arquivo).
- **Histórico:** cada passo fica registrado com data e usuário; dá para incluir anotações.
- **E-mail ao fornecedor:** a mesma tela de e-mail do chamado, com o e-mail do fornecedor do item e os modelos de garantia. Os **Documentos anexados** funcionam como no e-mail do chamado (veja [E-mail para a empresa](#e-mail-para-a-empresa)); aqui as notas sugeridas são as 5 aquisições mais recentes do item (incluindo a nota do próprio cadastro) e os anexos são os da garantia.

**Consulta:** busca (nº, item, número de série, defeito, protocolo), situação (em andamento, prazo vencido, encerradas, todas), status, tipo e fornecedor. Canceladas só aparecem filtrando pelo status Cancelada.

## Compras

Menu **Compras** na barra principal, com **Notas fiscais** e **Produtos x fornecedores**.

### Notas fiscais

**Consulta:** busca (número, chave, item, código), fornecedor, período de emissão, situação (ativas, desativadas, todas) e "só com itens sem relação com o cadastro". A lista mostra número/série, fornecedor, emissão, valor, itens (com quantos estão sem relação), garantia e anexos, com **✏️ Editar** e **🗑️ Desativar** (♻️ reativa).

**Cadastro (+ Nova nota):**
- **📥 Importar XML da NF-e:** primeiro mostra um **resumo para confirmar** (nota, fornecedor, itens e quantos já vêm relacionados ao cadastro); nada é preenchido antes de clicar em **Importar**. Ao importar, preenche número, série, chave, emissão, valor, fornecedor (o do cadastro com o mesmo CNPJ) e os itens (código no fornecedor, descrição, NCM, quantidade e valores). O XML também fica guardado como anexo da nota.
  - **Fornecedor fora do cadastro:** o resumo avisa e traz marcada a opção **Incluir no cadastro de fornecedores**, com razão social, fantasia, CNPJ, IE, telefone e endereço do XML (como distribuidor de produtos). Desmarcando, a nota fica só com o nome do XML.
- **Dados da nota:** número *, série, data de emissão *, valor total, fornecedor * (da lista de fornecedores ou digitado), CNPJ, chave de acesso (44 dígitos) e observação. Se o fornecedor digitado não estiver no cadastro, ao salvar o sistema pergunta se deve incluí-lo; sem a inclusão, a nota não é salva. O botão **+** ao lado do fornecedor abre o cadastro rápido de fornecedor (o mesmo de peças e equipamentos), já com o nome e o CNPJ digitados na nota; ao salvar, o fornecedor novo fica escolhido na nota.
- **Garantia** (Geral / Por produto e os campos de meses e data final na mesma linha):
  - **Geral:** vale para todos os itens; é obrigatória (meses ou data final; ao digitar os meses, a data final é calculada pela emissão).
  - **Por produto:** cada item ganha os campos de garantia (meses / até). Item sem garantia própria usa a garantia geral; se não houver nenhuma das duas, o sistema pede antes de salvar.
- **Itens:** podem vir do XML ou ser incluídos à mão (**+ Incluir item**). Na coluna **Relação com o cadastro**:
  - **🔗 relacionado** mostra a peça/produto do cadastro (com "pelo código do fornecedor" quando a relação veio sozinha), com **Trocar** e **Desfazer**;
  - **Sem relação** oferece **Escolher do cadastro** (busca por nome, modelo, marca ou nº de série) e **Cadastrar novo** (cria a peça/produto com o nome do item, o fornecedor e a nota).
- **Marca de cada item:** escolha da lista de marcas cadastradas. Marca digitada que não está no cadastro fica destacada; o **+** ao lado abre o cadastro rápido de marca já com o nome digitado e, ao salvar, a marca fica escolhida no item. Se ainda houver marcas fora do cadastro ao salvar a nota, o sistema pergunta se deve incluí-las (sem a inclusão, a nota não é salva). **Cadastrar novo** já leva a marca do item, e a peça/produto relacionado sem marca recebe a da nota.
- **Valores:** valor total da nota, valor unitário e desconto dos itens têm máscara de moeda (digite só os números; os dois últimos são os centavos). O total de cada item é quantidade × valor unitário − desconto do item.
- **Totais (abaixo dos itens):** soma dos itens, **(−) Desconto geral**, **(+) Adicional** (frete, seguro, IPI, outras despesas) e o **total calculado**. A conferência mostra na hora se o **valor total da nota confere** com o calculado ou a diferença. Ao salvar com diferença, o sistema pergunta (**Corrigir** ou **Salvar assim mesmo**); com o valor total vazio, fica o calculado. No XML, o desconto de cada item vem para o item, o desconto da nota que não está nos itens vira o desconto geral, e frete, seguro, outras despesas, IPI, ST e II viram o adicional.
- **Nota escaneada e anexos:** escolha o tipo (Nota escaneada, XML, Outro) e clique em **📎 Incluir arquivo** (PDF, imagem ou XML, até 3 MB). Os arquivos são guardados ao salvar.

**Ao salvar:**
- não aceita nota repetida (mesma chave, ou mesmo número/série do mesmo fornecedor);
- grava a relação **produto x fornecedor** de cada item relacionado: o próximo XML desse fornecedor já vem relacionado;
- cada item relacionado **entra no estoque** com a quantidade da nota (alterar a nota refaz as entradas; desativar tira);
- cada item relacionado vira uma **aquisição** da peça/produto (com a nota escaneada), sugerida no e-mail de garantia;
- a peça/produto sem data de garantia ou sem nota cadastradas recebe as desta compra.
- o **valor** da peça/produto passa a ser o valor unitário (já com o desconto do item) da **compra mais recente** (a nota ativa de data de emissão mais nova com o item). Lançar ou editar uma nota mais antiga não muda o valor; item da nota sem valor unitário também não. Notas lançadas antes desta regra atualizam o valor quando forem abertas e salvas de novo.

Desativar a nota tira as aquisições que ela gerou; reativar devolve.

### Produtos x fornecedores

Lista como cada fornecedor identifica as peças/produtos do cadastro (código e descrição na nota). As relações são gravadas ao salvar as notas; dá também para incluir à mão (peça/produto, fornecedor, CNPJ, código e descrição) e excluir. Se o mesmo fornecedor e código forem relacionados a outra peça, a relação é trocada.

## Estoque

Menu **Estoque**, com **Saldo de estoque** e **Movimentações**. O saldo de cada peça/produto do cadastro é a soma das movimentações.

**Saldo de estoque:**
- Cartões com os itens com saldo, abaixo do mínimo e zerados (clique para filtrar).
- Filtros: busca, tipo (peça/produto) e situação (com movimentação, com saldo, abaixo do mínimo, zerados).
- A lista mostra saldo e unidade, estoque mínimo, situação (OK, Abaixo do mínimo, Zerado; "Sem movimentação" para itens que nunca entraram) e a última movimentação. Abaixo do mínimo e zerados vêm primeiro.
- Ações de cada item: **➕ Entrada**, **➖ Saída**, **⚖️ Ajuste de inventário**, **📜 Movimentações do item** e **⚙️ Estoque mínimo e unidade**.

**Movimentações:**
- **Entradas das notas fiscais:** automáticas, pelos itens relacionados ao cadastro em Compras → Notas fiscais. Para corrigir, altere ou desative a nota. O botão **↻ Atualizar entradas das notas** abre um modal com filtros (**período de emissão**, **nº da nota** e **item**; vazios = todas as notas; o item já vem do filtro da lista) e refaz as entradas das notas escolhidas — com o filtro de item, cada nota que tem o item é refeita inteira. Sem filtros, refaz as entradas de todas as notas (por exemplo, das notas lançadas antes do estoque existir).
- **Entrada sem nota:** quantidade, valor unitário (opcional) e origem obrigatória (devolução, doação, transferência...).
- **Saída:** quantidade e destino: **chamado** (nº), **patrimônio** do equipamento ou observação. Não pode ser maior que o saldo. Saída para um chamado fica registrada nas Movimentações do chamado.
- **Ajuste de inventário:** informe a quantidade contada e o motivo; o sistema lança a diferença.
- O botão do modal de movimentação é **Salvar**.
- A lista tem filtros por item, tipo, origem, período e busca. Entradas sem nota, saídas e ajustes têm:
  - **✏️ Editar:** abre o modal preenchido. O tipo não muda (para trocar, exclua e lance de novo). Vale a mesma validação da inclusão, com o saldo calculado sem a própria movimentação; nenhuma alteração pode deixar saldo negativo, nem no item anterior quando o item é trocado. No ajuste, a quantidade contada é o saldo que deve ficar. Saída ligada a chamado registra a alteração no histórico do chamado.
  - **🗑️ Excluir:** pede o motivo (obrigatório) num modal; é exclusão lógica (a movimentação continua na lista com **Mostrar excluídas**) e não pode deixar o saldo negativo.
- Entradas de nota fiscal mostram "pela nota": altere ou desative a nota em Compras.

## Marcas e Localizações

Ficam em **Cadastros → Marcas** e **Cadastros → Localizações** (cada item abre só a sua lista). Cadastro simples (nome), usado nos cadastros de equipamentos e peças.

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
- situação, data de encerramento, **data base preventiva** e **prazo de cada preventiva**.

Ao preencher a data inicial, a data base preventiva é sugerida com o mesmo valor.

O **prazo de cada preventiva** define a data prevista das preventivas do contrato:
- **Até o fim do mês** (padrão): vence no último dia do mês da competência;
- **No dia da data base**: vence no mesmo dia da data base (ex.: data base 15/01 → prevista para o dia 15 de cada mês devido). Se o mês não tiver esse dia (31 em fevereiro, por exemplo), vale o último dia do mês.

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
- **Solicitar confirmação de leitura:** vem marcada. O e-mail pede ao destinatário a confirmação de leitura, que chega na **sua caixa de entrada** (não no sistema). Quem decide devolver é o programa de e-mail do destinatário: o Outlook costuma perguntar, e alguns programas ignoram o pedido.
- **📎 Documentos anexados** (logo abaixo de Cópia):
  - **Notas fiscais do cadastro de peças:** digite na busca (item, modelo, nº de série, nº da nota ou fornecedor) e marque as notas que vão anexadas; a busca procura nas aquisições de todas as peças/produtos (só notas com arquivo). Na garantia, as notas do item já aparecem sugeridas. As escolhidas ficam no resumo, com ✕ para tirar.
  - **Anexos do chamado / da garantia:** marque os documentos já guardados no registro.
  - **📎 Incluir do computador:** escolha um ou mais arquivos (até 3 MB cada); dá para clicar de novo para somar mais, e cada um sai pelo ✕. Os arquivos enviados também ficam guardados nos anexos do chamado (tipo Outro) ou da garantia (tipo "Enviado por e-mail").
  - O total pode ter até 20 MB. O histórico registra os nomes dos arquivos enviados.
- **Enviar:** o e-mail sai pela sua conta Google, fica registrado nas Movimentações do chamado (indicando se a confirmação foi pedida) e é guardado para o Reenviar.

## Agenda

Calendário com os eventos abaixo.

- **Período:** os botões **Dia**, **Semana**, **Mês** e **Ano** escolhem o que aparece; só o período escolhido é mostrado.
  - **Dia:** os eventos do dia, um embaixo do outro.
  - **Semana:** domingo a sábado, com os eventos escritos em cada dia.
  - **Mês:** a grade do mês, com um ponto colorido por tipo de evento (clique no dia para ver a lista).
  - **Ano:** os 12 meses com a quantidade de eventos por tipo; clicar num mês abre esse mês.
- As setas **‹ ›** andam um período (dia, semana, mês ou ano) e **Hoje** volta para a data de hoje no mesmo período.
- Os botões **Calendário** e **Lista por dia** trocam a visão. A lista mostra os eventos do período em sequência, separados por dia (data, dia da semana e quantidade); dias sem evento não aparecem.
- Clicar num evento abre o registro. O sistema lembra o último período e a última visão escolhidos.

| Evento | Data usada |
|---|---|
| Chamado | data de abertura |
| Preventiva | data prevista (fim do mês da competência ou dia da data base, conforme o prazo do contrato) |
| Contrato | data final de contratos ativos e não encerrados |
| Peça | data final da garantia |
| Garantia | prazo de resposta do fornecedor, nas garantias em andamento |

## Dashboard

As seções têm botão de exportação em CSV.

### Manutenção do mês

- **Indicadores:** preventivas da competência atual, percentual de itens de checklist executados, preventivas atrasadas (de qualquer mês, não só do atual) e corretivas fora do prazo.
- **Painéis:**
  - situação das preventivas;
  - lista das corretivas com SLA vencido;
  - ranking dos equipamentos com mais corretivas nos últimos 12 meses.
- **Atalhos:** clicar num indicador abre a Consulta de Chamados já filtrada. Clicar num item da lista abre o chamado.
- **📅 Próximas manutenções** (mês atual e o seguinte), em duas colunas:
  - **Abrir chamado:** preventivas previstas (dos 6 meses anteriores até o mês seguinte) que ainda não têm chamado (mesmas regras da geração automática: contrato vigente, serviço Preventiva, itens do checklist devidos no mês e equipamentos ativos), por mês, com contrato, empresa, quantidade de equipamentos e data prevista. As de meses passados, ou com a data prevista já vencida, aparecem como **atrasada** / **sem chamado**. Administradores veem uma caixa de seleção em cada contrato (todas vêm marcadas; **todos** marca ou desmarca o mês inteiro) e o botão **Gerar chamados (N)**, que gera só para os contratos marcados, após confirmar a lista.
  - **Agendar com a empresa:** chamados preventivos ainda **Abertos** com data prevista até o fim do mês seguinte, com o último e-mail enviado à empresa (ou "sem contato com a empresa"); atrasados ficam marcados. **📧** abre o e-mail já com o modelo de agendamento; **👁️** abre o chamado. Ao passar para Em andamento, o chamado sai da lista, a não ser que a data prevista já tenha passado: aí continua, marcado como **em andamento** e atrasado, até ser concluído. O título mostra quantas estão atrasadas.

### Demais seções

Chamados, Contratos (vigentes, vencendo em 30 dias, vencidos, encerrados), Equipamentos, Peças e Fornecedores. Em Peças, o indicador **Estoque abaixo do mínimo** leva ao Saldo de estoque filtrado, e os indicadores **Garantias em andamento** e **Garantias com prazo vencido** e a lista das garantias em andamento levam à tela de Garantias.

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

O menu **Configuração** tem os itens **Usuários**, **Modelos de e-mail** e **Migrações da planilha**.

### Configuração → Migrações da planilha

Confere se a planilha tem todas as abas e colunas que o sistema usa.
- **Estrutura das abas:** cada aba com a situação (OK, Aba não existe, Faltam colunas), as colunas a incluir e avisos de cabeçalho com nome diferente do esperado.
- **Migrações de dados:** cada ajuste de dados com a data em que foi aplicado, ou Pendente.
- **🔍 Verificar estrutura** só confere. **▶️ Executar migrações** cria as abas que faltam, completa os cabeçalhos das colunas novas e roda as migrações de dados pendentes, mostrando o relatório. Não renomeia, não reordena e não apaga nada, e pode ser executado de novo. Rode depois de cada atualização do sistema. Só administradores (propriedade `ADMINS`) executam.

### Configuração → Modelos de e-mail

Lista os modelos usados no [e-mail para a empresa](#e-mail-para-a-empresa) e no e-mail ao fornecedor da [garantia](#garantias), com **Alterar** e **Excluir** em cada linha e o botão **+ Novo modelo**.

- Cada modelo tem nome (não pode repetir), **Usado em** (Chamado ou Garantia), assunto e mensagem. A tela de envio mostra só os modelos do seu tipo.
- Os botões de **Campos** inserem, onde está o cursor, marcadores como `{{numero_chamado}}` e `{{empresa}}` (chamado) ou `{{numero_garantia}}`, `{{item}}` e `{{numero_serie}}` (garantia). No envio, eles viram os dados do registro.
- Campos do **remetente** (quem envia), nos dois tipos: `{{usuario}}` (nome), `{{usuario_email}}` (e-mail do cadastro em Usuários ou, vazio, o da conta Google), `{{usuario_telefone}}` (telefone / ramal) e `{{usuario_setor}}`. Vêm do cadastro em **Configuração → Usuários**; se estiverem vazios lá, saem em branco.
- Na primeira vez, o sistema cria cinco modelos de chamado (solicitação de atendimento, cobrança de prazo de atendimento, cobrança de prazo de solução, agendamento e solicitação de atualização) e dois de garantia (acionamento de garantia e cobrança de resposta).

### Configuração → Usuários

**Campos:** matrícula, **usuário** (login Google, a parte antes do `@`), nome, lotação, setor, **e-mail** e **telefone / ramal** (os dois opcionais, para contato; aparecem nos e-mails pelos campos do remetente).

- Na lista, o ✏️ carrega o usuário no formulário de cima; o botão passa a ser **Salvar alteração** (e **Cancelar** desfaz). Usuário desativado precisa ser reativado antes de alterar.

- O login não pode se repetir.
- O sistema identifica quem está usando pelo e-mail da conta Google. O **nome** cadastrado é o que aparece em "Aberto por" e no registro do checklist.
- Quem não está cadastrado aparece como "Desconhecido".
- O **nome** e o **setor** do usuário aparecem no canto direito da barra de menu, com as iniciais. Passando o mouse, aparecem a lotação e o e-mail. Sem cadastro, aparecem o e-mail e o aviso "Não cadastrado em Usuários".
