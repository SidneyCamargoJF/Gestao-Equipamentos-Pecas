// =====================================================
// BUSCA DE EQUIPAMENTO POR PATRIMÔNIO/LOCALIZAÇÃO -- compartilhado entre
// Chamados e Contrato (e qualquer outra tela que precise achar um
// equipamento de tbl_equipamentos a partir do que a pessoa digitou).
// Movido de CadastroChamadoBackend.js -- não duplicar em outro lugar.
// =====================================================

function verificarPatrimonioEquipamento(patrimonio) {
  const patrimonioBuscado = String(patrimonio || '').trim().toLowerCase();
  if (!patrimonioBuscado) return { existe: false };

  const dados = ReadEquipments();
  for (let i = 0; i < dados.length; i++) {
    const patrimonioLinha = String(dados[i][5] || '').trim().toLowerCase();
    if (patrimonioLinha === patrimonioBuscado) {
      return {
        existe: true,
        id: dados[i][0] || '',
        nome: dados[i][1] || '',
        localizacao: dados[i][7] || '',
        capacidade: dados[i][3] || '',
        marca: dados[i][2] || '',
        modelo: dados[i][4] || '',
        sequencia: dados[i][6] || ''
      };
    }
  }
  return { existe: false };
}

/**
 * Busca por Nome (linha[1] de tbl_equipamentos), igual exato ou "contém" --
 * devolve TODOS os que baterem (ex: "ar condicionado" pode achar vários
 * equipamentos diferentes), não só o primeiro.
 */
function buscarEquipamentosPorNome(nome) {
  const nomeBuscado = String(nome || '').trim().toLowerCase();
  if (!nomeBuscado) return [];

  const dados = ReadEquipments();
  return dados
    .filter(e => String(e[1] || '').trim().toLowerCase().includes(nomeBuscado))
    .map(encontrado => ({
      id: encontrado[0] || '',
      nome: encontrado[1] || '',
      marca: encontrado[2] || '',
      capacidade: encontrado[3] || '',
      modelo: encontrado[4] || '',
      patrimonio: encontrado[5] || '',
      sequencia: encontrado[6] || '',
      localizacao: encontrado[7] || ''
    }));
}

function buscarEquipamentosPorEspecificacao(categoria, tipo, capacidade) {
  const categoriaBuscada = String(categoria || '').trim().toLowerCase();
  const tipoBuscado = String(tipo || '').trim().toLowerCase();
  const capacidadeBuscada = String(capacidade || '').trim().toLowerCase();
  if (!categoriaBuscada || !tipoBuscado || !capacidadeBuscada) return [];

  const dados = ReadEquipments();
  return dados
    .filter(e =>
      String(e[1] || '').trim().toLowerCase() === categoriaBuscada &&
      String(e[4] || '').trim().toLowerCase() === tipoBuscado &&
      String(e[3] || '').trim().toLowerCase() === capacidadeBuscada
    )
    .map(encontrado => ({
      id: encontrado[0] || '',
      nome: encontrado[1] || '',
      marca: encontrado[2] || '',
      capacidade: encontrado[3] || '',
      modelo: encontrado[4] || '',
      patrimonio: encontrado[5] || '',
      sequencia: encontrado[6] || '',
      localizacao: encontrado[7] || ''
    }));
}

/**
 * Combinações reais de Nome/Modelo/Capacidade já cadastradas em
 * tbl_equipamentos (uma linha por combinação distinta) -- usado pra
 * preencher os 3 selects em cascata de especificação do serviço no
 * Cadastro de Contrato: escolhendo a categoria, só aparecem os tipos que
 * existem pra ela; escolhendo o tipo, só aparecem as capacidades que
 * existem pra esse par categoria+tipo. Evita combinação impossível tipo
 * "Elevador 18.000 BTUs".
 */
function buscarOpcoesEspecificacaoEquipamento() {
  const dados = ReadEquipments();
  const vistos = new Set();
  const combinacoes = [];

  dados.forEach(function (e) {
    const categoria = String(e[1] || '').trim();
    const tipo = String(e[4] || '').trim();
    const capacidade = String(e[3] || '').trim();
    if (!categoria || !tipo || !capacidade) return;

    const chave = categoria + '||' + tipo + '||' + capacidade;
    if (vistos.has(chave)) return;
    vistos.add(chave);
    combinacoes.push({ categoria: categoria, tipo: tipo, capacidade: capacidade });
  });

  combinacoes.sort(function (a, b) {
    return a.categoria.localeCompare(b.categoria) ||
      a.tipo.localeCompare(b.tipo) ||
      a.capacidade.localeCompare(b.capacidade);
  });

  return { combinacoes: combinacoes };
}

function buscarEquipamentoIdPorPatrimonio(patrimonio) {
  const patrimonioBuscado = String(patrimonio || '').trim().toLowerCase();
  if (!patrimonioBuscado) return '';

  const dados = ReadEquipments();
  for (let i = 0; i < dados.length; i++) {
    const patrimonioLinha = String(dados[i][5] || '').trim().toLowerCase();
    if (patrimonioLinha === patrimonioBuscado) {
      return dados[i][0];
    }
  }
  return '';
}

/**
 * Busca o ID de um equipamento em tbl_equipamentos pela Localização --
 * só resolve se bater com exatamente 1 equipamento (Localização sozinha
 * não é uma chave única, então em caso de ambiguidade não arrisca).
 * Retorna o ID ou '' se não encontrar ou encontrar mais de um.
 */
function buscarEquipamentoIdPorLocalizacao(localizacao) {
  const localizacaoBuscada = String(localizacao || '').trim().toLowerCase();
  if (!localizacaoBuscada) return '';

  const dados = ReadEquipments();
  const encontrados = dados.filter(linha => String(linha[7] || '').trim().toLowerCase() === localizacaoBuscada);

  return (encontrados.length === 1) ? encontrados[0][0] : '';
}
