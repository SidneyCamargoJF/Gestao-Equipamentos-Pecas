

    // State Store Data
    const equipamentosMock = [
      { id: 1, nome:'Split Hi-Wall 9000 BTUs', patrimonio:'AC-001', marca:'LG', localizacao:'Sala 101' },
      { id: 2, nome:'Split Hi-Wall 12000 BTUs', patrimonio:'AC-002', marca:'Samsung', localizacao:'Sala 102' },
      { id: 3, nome:'Cassete 18000 BTUs', patrimonio:'AC-003', marca:'Midea', localizacao:'Salão Reuniões' },
      { id: 4, nome:'Piso Teto 24000 BTUs', patrimonio:'AC-004', marca:'Carrier', localizacao:'Auditório' },
      { id: 5, nome:'Split Hi-Wall 12000 BTUs', patrimonio:'AC-005', marca:'Elgin', localizacao:'Sala 103' },
      { id: 6, nome:'Janela 7500 BTUs', patrimonio:'AC-006', marca:'Consul', localizacao:'Copa' },
      { id: 7, nome:'Multi Split 18000 BTUs', patrimonio:'AC-009', marca:'LG', localizacao:'Diretoria' },
      { id: 8, nome:'Cassete 36000 BTUs', patrimonio:'AC-008', marca:'Toshiba', localizacao:'Salão Principal' },
      { id: 9, nome:'VRF 60000 BTUs', patrimonio:'AC-020', marca:'Daikin', localizacao:'Central' }
    ];

    const pecasMock = [
      { codigo: 'P-01', desc: 'Filtro Lavável Hi-Wall', cat: 'Filtros', qtd: 14, min: 5, status: 'OK' },
      { codigo: 'P-02', desc: 'Gás Refrigerante R410A (Kg)', cat: 'Insumos', qtd: 2, min: 5, status: 'Baixo' },
      { codigo: 'P-03', desc: 'Capacitor de Partida 35uF', cat: 'Elétrica', qtd: 8, min: 3, status: 'OK' },
      { codigo: 'P-04', desc: 'Placa Universal Ar Condicionado', cat: 'Eletrônica', qtd: 1, min: 2, status: 'Crítico' }
    ];

    const chamadosMock = [
      { id: 'CH-101', req: 'Carlos Lima', eq: 'Split Hi-Wall 12000 BTUs', prio: 'Alta', status: 'Aberto' },
      { id: 'CH-102', req: 'Ana Souza', eq: 'Cassete 36000 BTUs', prio: 'Média', status: 'Em Atendimento' },
      { id: 'CH-103', req: 'Marcos R.', eq: 'VRF 60000 BTUs', prio: 'Baixa', status: 'Concluído' }
    ];


    // Base de equipamentos cadastrados (mock) — Ar Condicionado
    const baseEquipamentos = [
      { patrimonio:'AC-001', nome:'Split Hi-Wall 9000 BTUs', capacidade:'9000 BTUs', marca:'LG', modelo:'S9WT', localizacao:'Sala 101' },
      { patrimonio:'AC-002', nome:'Split Hi-Wall 12000 BTUs', capacidade:'12000 BTUs', marca:'Samsung', modelo:'AR12', localizacao:'Sala 102' },
      { patrimonio:'AC-003', nome:'Cassete 18000 BTUs', capacidade:'18000 BTUs', marca:'Midea', modelo:'CASS-18', localizacao:'Salão Reuniões' },
      { patrimonio:'AC-004', nome:'Piso Teto 24000 BTUs', capacidade:'24000 BTUs', marca:'Carrier', modelo:'PT-24', localizacao:'Auditório' },
      { patrimonio:'AC-005', nome:'Split Hi-Wall 12000 BTUs', capacidade:'12000 BTUs', marca:'Elgin', modelo:'E12', localizacao:'Sala 103' },
      { patrimonio:'AC-006', nome:'Janela 7500 BTUs', capacidade:'7500 BTUs', marca:'Consul', modelo:'C7', localizacao:'Copa' },
      { patrimonio:'AC-007', nome:'Split Hi-Wall 9000 BTUs', capacidade:'9000 BTUs', marca:'Springer', modelo:'S9', localizacao:'Sala 104' },
      { patrimonio:'AC-008', nome:'Cassete 36000 BTUs', capacidade:'36000 BTUs', marca:'Toshiba', modelo:'TC-36', localizacao:'Salão Principal' },
      { patrimonio:'AC-009', nome:'Multi Split 18000 BTUs', capacidade:'18000 BTUs', marca:'LG', modelo:'M18', localizacao:'Diretoria' },
      { patrimonio:'AC-010', nome:'Split Hi-Wall 24000 BTUs', capacidade:'24000 BTUs', marca:'Samsung', modelo:'AR24', localizacao:'Sala 201' },
      { patrimonio:'AC-011', nome:'Piso Teto 30000 BTUs', capacidade:'30000 BTUs', marca:'Carrier', modelo:'PT-30', localizacao:'Salão 2' },
      { patrimonio:'AC-012', nome:'Split Hi-Wall 9000 BTUs', capacidade:'9000 BTUs', marca:'Midea', modelo:'M9', localizacao:'Sala 202' },
      { patrimonio:'AC-013', nome:'Cassete 24000 BTUs', capacidade:'24000 BTUs', marca:'York', modelo:'YC-24', localizacao:'Recepção' },
      { patrimonio:'AC-014', nome:'Janela 10000 BTUs', capacidade:'10000 BTUs', marca:'Springer', modelo:'S10', localizacao:'Almoxarifado' },
      { patrimonio:'AC-015', nome:'Split Hi-Wall 12000 BTUs', capacidade:'12000 BTUs', marca:'Fujitsu', modelo:'F12', localizacao:'Sala 203' },
      { patrimonio:'AC-016', nome:'Multi Split 24000 BTUs', capacidade:'24000 BTUs', marca:'LG', modelo:'M24', localizacao:'Gerência' },
      { patrimonio:'AC-017', nome:'Cassete 48000 BTUs', capacidade:'48000 BTUs', marca:'Toshiba', modelo:'TC-48', localizacao:'Salão Nobre' },
      { patrimonio:'AC-018', nome:'Split Hi-Wall 18000 BTUs', capacidade:'18000 BTUs', marca:'Elgin', modelo:'E18', localizacao:'Sala 301' },
      { patrimonio:'AC-019', nome:'Piso Teto 36000 BTUs', capacidade:'36000 BTUs', marca:'Midea', modelo:'PT-36', localizacao:'Salão 3' },
      { patrimonio:'AC-020', nome:'VRF 60000 BTUs', capacidade:'60000 BTUs', marca:'Daikin', modelo:'VRV-60', localizacao:'Central' }
    ];

    // Base de serviços cadastrados (mock) — Ar Condicionado
    const baseServicos = [
      { nome:'Manutenção Preventiva de Split', periodicidade:'mensal', valor:120.00 },
      { nome:'Limpeza de Filtros', periodicidade:'quinzenal', valor:80.00 },
      { nome:'Higienização de Bandeja', periodicidade:'trimestral', valor:150.00 },
      { nome:'Limpeza de Evaporador', periodicidade:'semestral', valor:250.00 },
      { nome:'Limpeza de Condensador', periodicidade:'semestral', valor:280.00 },
      { nome:'Recarga de Gás R410A', periodicidade:'sob-demanda', valor:350.00 },
      { nome:'Recarga de Gás R22', periodicidade:'sob-demanda', valor:400.00 },
      { nome:'Desinfecção do Sistema', periodicidade:'trimestral', valor:180.00 },
      { nome:'Limpeza de Duto', periodicidade:'anual', valor:500.00 },
      { nome:'Manutenção Corretiva de Split', periodicidade:'sob-demanda', valor:200.00 },
      { nome:'Limpeza de Torres de Resfriamento', periodicidade:'semestral', valor:1200.00 },
      { nome:'Manutenção de VRF', periodicidade:'mensal', valor:450.00 },
      { nome:'Limpeza de Cassete', periodicidade:'trimestral', valor:220.00 },
      { nome:'Manutenção de Janela', periodicidade:'mensal', valor:90.00 },
      { nome:'Limpeza de Piso Teto', periodicidade:'trimestral', valor:200.00 },
      { nome:'Inspeção Termográfica', periodicidade:'anual', valor:350.00 },
      { nome:'Limpeza de Bomba de Dreno', periodicidade:'mensal', valor:60.00 },
      { nome:'Manutenção de Multi Split', periodicidade:'mensal', valor:180.00 },
      { nome:'Limpeza Geral do Sistema', periodicidade:'semestral', valor:350.00 },
      { nome:'Instalação de Split', periodicidade:'unica', valor:600.00 }
    ];

    // Base de produtos cadastrados (mock) — Ar Condicionado
    const baseProdutos = [
      { nome:'Filtro de Ar para Split' },
      { nome:'Gás Refrigerante R410A' },
      { nome:'Gás Refrigerante R22' },
      { nome:'Óleo Lubrificante para Compressor' },
      { nome:'Cabo de Alimentação 3m' },
      { nome:'Dreno Flexível 1/2"' },
      { nome:'Suporte para Split Parede' },
      { nome:'Parafuso de Fixação' },
      { nome:'Bucha de Nylon S10' },
      { nome:'Fita Isolante 20m' },
      { nome:'Protetor de Sobretensão' },
      { nome:'Termostato Digital' },
      { nome:'Controle Remoto Universal' },
      { nome:'Bomba de Dreno' },
      { nome:'Mangueira de Cobre 1/4"' },
      { nome:'Mangueira de Cobre 3/8"' },
      { nome:'Abraçadeira Metálica' },
      { nome:'Selante de Rosca' },
      { nome:'Capacitor de Partida' },
      { nome:'Placa Eletrônica Universal' }
    ];

    // Base de itens de checklist (mock) — Ar Condicionado
    const baseChecklist = [
      { descricao:'Verificar temperatura do ar insuflado' },
      { descricao:'Inspecionar filtros de ar' },
      { descricao:'Verificar dreno de condensado' },
      { descricao:'Inspecionar serpentina do evaporador' },
      { descricao:'Verificar pressão do gás refrigerante' },
      { descricao:'Inspecionar motor do ventilador' },
      { descricao:'Verificar capacitor de partida' },
      { descricao:'Inspecionar contatores elétricos' },
      { descricao:'Verificar corrente elétrica do compressor' },
      { descricao:'Inspecionar correia do ventilador' },
      { descricao:'Verificar nível de óleo do compressor' },
      { descricao:'Inspecionar válvula de expansão' },
      { descricao:'Verificar isolamento térmico das linhas' },
      { descricao:'Inspecionar bandeja de condensado' },
      { descricao:'Verificar funcionamento do termostato' },
      { descricao:'Inspecionar conexões elétricas' },
      { descricao:'Verificar vibração do compressor' },
      { descricao:'Inspecionar aletas do condensador' },
      { descricao:'Verificar dreno secundário' },
      { descricao:'Inspecionar suportes e fixações' }
    ];

    // 
    // DADOS MOCK
    // 
    const opcoesEmpresa = [
      'Climatização Total Ltda','Ar Condicionado Premium S.A.','Frio & Clima Ltda',
      'Climatécnica Engenharia','Ar Service Manutenção','Climafrio Soluções',
      'Ambient Clima Ltda','Frigelar Comércio','Clima Sul Refrigeração',
      'Arpoador Climatização','Climazon Tecnologia','Frio Control Serviços',
      'Clima Certo Ltda','Ar Condicionado Center','Climatização Brasil',
      'Cold Ar Condicionado','Clima Perfeito Ltda','Ar Livre Climatização',
      'Climatização Eficiente','Frio Total Refrigeração'
    ];
