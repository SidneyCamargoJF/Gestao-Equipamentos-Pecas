// =====================================================
// BACKEND (Apps Script) - CADASTRO DE FORNECEDOR
// Chamado pelo cliente (CadastroFornecedorFormJS) via google.script.run
// =====================================================

// Linha 1 = cabeçalho, linha 2 = (reservada/em branco no seu layout atual),
// os dados de fato começam na linha 3.
const PRIMEIRA_LINHA_DADOS_FORNECEDOR = 3;

/**
 * Salva ou atualiza um fornecedor na aba "tbl_fornecedor".
 * Recebe um objeto com os campos do formulário HTML (ver coletarDadosFornecedor()
 * no cliente). Se já existir um fornecedor com o mesmo CNPJ, atualiza a linha
 * existente; caso contrário, cria uma nova.
 *
 * Retorna { sucesso: boolean, mensagem: string, modo?: 'criacao'|'edicao', id?: number }
 */
function salvarFornecedorBackend(dados) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const abaTabelaFornecedor = ss.getSheetByName('tbl_fornecedor');

  const razaoSocial = dados.razaoSocial;
  const nomeFantasia = dados.nomeFantasia;
  let cnpj = dados.cnpj;
  const inscricaoEstadual = dados.inscricaoEstadual;
  const inscricaoMunicipal = dados.inscricaoMunicipal;
  const email = dados.email;
  const telefoneFixo = dados.telefoneFixo;
  const telefoneCelular = dados.telefoneCelular;
  const whatsapp = dados.whatsapp;
  let cep = dados.cep;
  const ruaAvenida = dados.ruaAvenida;
  const numero = dados.numero;
  const bairro = dados.bairro;
  const cidade = dados.cidade;
  const estado = dados.estado;
  const complemento = dados.complemento;

  const dataAtual = Utilities.formatDate(new Date(), "GMT-3", "dd/MM/yyyy");
  const status = "Ativo";

  // Validação de campos obrigatórios (repetida no servidor por segurança,
  // mesmo já validando no cliente antes de chamar essa função)
  if (!razaoSocial || !nomeFantasia || !cnpj || !inscricaoEstadual || !inscricaoMunicipal ||
    !cep || !ruaAvenida || !numero || !bairro || !cidade || !estado) {
    return { sucesso: false, mensagem: 'ERRO: Faltam dados obrigatórios.' };
  }

  // Limpeza de formatação
  cep = cep.toString().replace(/\D/g, '');
  cnpj = cnpj.toString().trim();

  const dadosTabela = abaTabelaFornecedor.getDataRange().getValues();
  let linhaDestino = -1;

  // Busca se o CNPJ já existe na Coluna D (índice 3 da matriz).
  // dadosTabela[0] = linha 1, então a linha 3 corresponde ao índice 2.
  for (let i = PRIMEIRA_LINHA_DADOS_FORNECEDOR - 1; i < dadosTabela.length; i++) {
    if (dadosTabela[i][3].toString().trim() === cnpj) {
      linhaDestino = i + 1; // Linha real encontrada para EDIÇÃO
      break;
    }
  }

  if (linhaDestino !== -1) {
    // === MODO EDIÇÃO ===
    const idExistente = dadosTabela[linhaDestino - 1][0];
    const dataCadastroOriginal = dadosTabela[linhaDestino - 1][17];

    const dadosAtualizados = [
      idExistente, razaoSocial, nomeFantasia, cnpj, inscricaoEstadual,
      inscricaoMunicipal, email, telefoneFixo, telefoneCelular, whatsapp,
      cep, ruaAvenida, numero, bairro, cidade,
      estado, complemento, dataCadastroOriginal, dataAtual, status
    ];

    abaTabelaFornecedor.getRange(linhaDestino, 1, 1, 20).setValues([dadosAtualizados]);
    return { sucesso: true, mensagem: 'Fornecedor ATUALIZADO com sucesso!', modo: 'edicao', id: idExistente };

  } else {
    // === MODO CRIAÇÃO ===
    // Se a planilha ainda não tem nenhuma linha de dados (só cabeçalho/linha
    // reservada), a "última linha" pra fins de cálculo é a linha anterior à
    // primeira linha de dados — assim o novo registro cai certinho na linha 3.
    const ultimaLinhaPlanilha = abaTabelaFornecedor.getLastRow();
    const ultimaLinha = Math.max(ultimaLinhaPlanilha, PRIMEIRA_LINHA_DADOS_FORNECEDOR - 1);

    let novoId;
    if (ultimaLinha < PRIMEIRA_LINHA_DADOS_FORNECEDOR) {
      // Nenhum fornecedor cadastrado ainda
      novoId = 1;
    } else {
      let idAtual = abaTabelaFornecedor.getRange(ultimaLinha, 1).getValue();
      if (idAtual === "" || idAtual === "ID" || isNaN(Number(idAtual))) idAtual = 0;
      novoId = Number(idAtual) + 1;
    }

    const novosDados = [
      novoId, razaoSocial, nomeFantasia, cnpj, inscricaoEstadual,
      inscricaoMunicipal, email, telefoneFixo, telefoneCelular, whatsapp,
      cep, ruaAvenida, numero, bairro, cidade,
      estado, complemento, dataAtual, "", status
    ];

    abaTabelaFornecedor.getRange(ultimaLinha + 1, 1, 1, 20).setValues([novosDados]);
    return { sucesso: true, mensagem: 'Fornecedor CADASTRADO com sucesso!', modo: 'criacao', id: novoId };
  }
}

/**
 * Cadastro rápido de fornecedor com apenas os campos essenciais (CNPJ, Razão
 * Social, Nome Fantasia, Cidade). Os demais campos ficam em branco e podem
 * ser completados depois pela tela completa de Cadastro de Fornecedor.
 * Chamado pelo botão "+" ao lado do campo Fornecedor no Cadastro de Peças.
 */
function cadastrarFornecedorRapido(dados) {
  try {
    const razaoSocial = ((dados && dados.razaoSocial) || '').toString().trim();
    const nomeFantasia = ((dados && dados.nomeFantasia) || '').toString().trim();
    const cnpj = ((dados && dados.cnpj) || '').toString().trim();
    const cidade = ((dados && dados.cidade) || '').toString().trim();
    const email = (dados && dados.email) ? dados.email.toString().trim() : '';
    const telefoneFixo = (dados && dados.telefoneFixo) ? dados.telefoneFixo.toString().trim() : '';

    if (!razaoSocial || !nomeFantasia || !cnpj || !cidade || !email || !telefoneFixo) {
      return { sucesso: false, mensagem: 'Preencha todos os campos obrigatórios.' };
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const abaTabelaFornecedor = ss.getSheetByName('tbl_fornecedor');

    if (!abaTabelaFornecedor) {
      return { sucesso: false, mensagem: "Aba 'tbl_fornecedor' não foi encontrada na planilha." };
    }

    const dadosTabela = abaTabelaFornecedor.getDataRange().getValues();

    for (let i = PRIMEIRA_LINHA_DADOS_FORNECEDOR - 1; i < dadosTabela.length; i++) {
      if (dadosTabela[i][3] && dadosTabela[i][3].toString().trim() === cnpj) {
        return { sucesso: false, mensagem: 'Já existe um fornecedor cadastrado com este CNPJ.' };
      }
    }

    const dataAtual = Utilities.formatDate(new Date(), "GMT-3", "dd/MM/yyyy");
    const ultimaLinhaPlanilha = abaTabelaFornecedor.getLastRow();
    const ultimaLinha = Math.max(ultimaLinhaPlanilha, PRIMEIRA_LINHA_DADOS_FORNECEDOR - 1);

    let novoId;
    if (ultimaLinha < PRIMEIRA_LINHA_DADOS_FORNECEDOR) {
      novoId = 1;
    } else {
      let idAtual = abaTabelaFornecedor.getRange(ultimaLinha, 1).getValue();
      if (idAtual === "" || idAtual === "ID" || isNaN(Number(idAtual))) idAtual = 0;
      novoId = Number(idAtual) + 1;
    }

    // [id, razaoSocial, nomeFantasia, cnpj, inscEstadual, inscMunicipal, email,
    //  telefoneFixo, celular, whatsapp, cep, logradouro, numero, bairro,
    //  cidade, estado, complemento, dataCadastro, dataAlteracao, status]
    const novosDados = [
      novoId,
      razaoSocial,
      nomeFantasia,
      cnpj,
      "",
      "",
      email,
      telefoneFixo,
      "",
      "",
      "",
      "",
      "",
      "",
      cidade,
      "",
      "",
      dataAtual,
      "",
      "Ativo"
    ];

    abaTabelaFornecedor.getRange(ultimaLinha + 1, 1, 1, 20).setValues([novosDados]);
    return { sucesso: true, mensagem: 'Fornecedor cadastrado com sucesso!', id: novoId };

  } catch (e) {
    return { sucesso: false, mensagem: 'Erro no servidor: ' + e.message };
  }
}

/**
 * Verifica se já existe um fornecedor cadastrado com o CNPJ informado.
 * Chamado quando o usuário sai do campo CNPJ (evento blur) no formulário.
 * Retorna { existe: boolean }
 */
function verificarCnpjExistente(cnpj) {
  if (!cnpj) return { existe: false };

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const abaTabelaFornecedor = ss.getSheetByName('tbl_fornecedor');
  const cnpjLimpo = cnpj.toString().trim();

  const dadosTabela = abaTabelaFornecedor.getDataRange().getValues();

  for (let i = PRIMEIRA_LINHA_DADOS_FORNECEDOR - 1; i < dadosTabela.length; i++) {
    if (dadosTabela[i][3].toString().trim() === cnpjLimpo) {
      return { existe: true };
    }
  }
  return { existe: false };
}

/**
 * Busca os dados completos de um fornecedor pelo CNPJ, para carregar no
 * formulário em modo de edição (fluxo de CNPJ duplicado no Cadastro).
 * Retorna um objeto já no formato dos campos do HTML (mesmos nomes usados em
 * coletarDadosFornecedor no cliente) ou null se não encontrar.
 */
function buscarFornecedorPorCnpjBackend(cnpj) {
  if (!cnpj) return null;

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const abaTabelaFornecedor = ss.getSheetByName('tbl_fornecedor');
  const cnpjLimpo = cnpj.toString().trim();

  const dadosTabela = abaTabelaFornecedor.getDataRange().getValues();

  for (let i = PRIMEIRA_LINHA_DADOS_FORNECEDOR - 1; i < dadosTabela.length; i++) {
    const linha = dadosTabela[i];
    if (linha[3].toString().trim() === cnpjLimpo) {
      return {
        id: linha[0],
        razaoSocial: linha[1],
        nomeFantasia: linha[2],
        cnpj: linha[3],
        inscricaoEstadual: linha[4],
        inscricaoMunicipal: linha[5],
        email: linha[6],
        telefoneFixo: linha[7],
        telefoneCelular: linha[8],
        whatsapp: linha[9],
        cep: linha[10],
        ruaAvenida: linha[11],
        numero: linha[12],
        bairro: linha[13],
        cidade: linha[14],
        estado: linha[15],
        complemento: linha[16]
      };
    }
  }
  return null;
}

/**
 * Monta o objeto completo de um fornecedor a partir de uma linha crua da
 * planilha (mesma ordem de colunas usada em salvarFornecedorBackend).
 * Usado tanto por buscarFornecedorPorIdBackend quanto por FiltrarFornecedores.
 */
function mapLinhaParaFornecedorCompleto(linha) {
  return {
    id: linha[0],
    razaoSocial: linha[1],
    nomeFantasia: linha[2],
    cnpj: linha[3],
    inscricaoEstadual: linha[4],
    inscricaoMunicipal: linha[5],
    email: linha[6],
    telefoneFixo: linha[7],
    telefoneCelular: linha[8],
    whatsapp: linha[9],
    cep: linha[10],
    ruaAvenida: linha[11],
    numero: linha[12],
    bairro: linha[13],
    cidade: linha[14],
    estado: linha[15],
    complemento: linha[16],
    dataCadastro: linha[17],
    dataAtualizacao: linha[18],
    status: linha[19]
  };
}

/**
 * Busca os dados completos de um fornecedor pelo ID (coluna A), pra usar no
 * fluxo de edição vindo da tela de Consulta (editarFornecedor(id) →
 * trocarPagina('fornecedor-form', id)). Retorna o mesmo formato de
 * buscarFornecedorPorCnpjBackend, ou null se não encontrar.
 */
function buscarFornecedorPorIdBackend(id) {
  if (id === null || id === undefined || id === '') return null;

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const abaTabelaFornecedor = ss.getSheetByName('tbl_fornecedor');
  const idBuscado = String(id).trim();

  const dadosTabela = abaTabelaFornecedor.getDataRange().getValues();

  for (let i = PRIMEIRA_LINHA_DADOS_FORNECEDOR - 1; i < dadosTabela.length; i++) {
    const linha = dadosTabela[i];
    if (String(linha[0]).trim() === idBuscado) {
      return mapLinhaParaFornecedorCompleto(linha);
    }
  }
  return null;
}

/**
 * Consulta fornecedores na aba "tbl_fornecedor" a partir dos filtros vindos
 * da tela ConsultaFornecedorForm (chamada pelo cliente em consultarFornecedores()).
 *
 * criterios = { nome, cnpj, cidade, estado }
 * ("nome" busca tanto em Razão Social quanto em Nome Fantasia; nome/CNPJ/
 * cidade usam comparação "contém", já que na tela HTML são campos de busca
 * livre; Estado usa igualdade exata, por ser um select)
 *
 * Retorna um array de objetos { id, razaoSocial, nomeFantasia, cnpj,
 * telefone, email, cidade, estado } prontos pro renderTabelaFornecedores(),
 * ou a string "NoData" se nada for encontrado.
 */
function FiltrarFornecedores(criterios) {
  criterios = criterios || {};

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const abaTabelaFornecedor = ss.getSheetByName('tbl_fornecedor');

  const sNome = String(criterios.nome || '').trim().toLowerCase();
  const sCnpj = String(criterios.cnpj || '').replace(/\D/g, ''); // compara só os dígitos
  const sCidade = String(criterios.cidade || '').trim().toLowerCase();
  const sEstado = String(criterios.estado || '').trim().toLowerCase();

  const dadosTabela = abaTabelaFornecedor.getDataRange().getValues();
  const resultado = [];

  for (let i = PRIMEIRA_LINHA_DADOS_FORNECEDOR - 1; i < dadosTabela.length; i++) {
    const linha = dadosTabela[i];

    const tRazaoSocial = String(linha[1] || '').trim().toLowerCase();
    const tNomeFantasia = String(linha[2] || '').trim().toLowerCase();
    const tCnpj = String(linha[3] || '').replace(/\D/g, '');
    const tCidade = String(linha[14] || '').trim().toLowerCase();
    const tEstado = String(linha[15] || '').trim().toLowerCase();

    const condicaoNome = (sNome === '' || tRazaoSocial.includes(sNome) || tNomeFantasia.includes(sNome));
    const condicaoCnpj = (sCnpj === '' || tCnpj.includes(sCnpj));
    const condicaoCidade = (sCidade === '' || tCidade.includes(sCidade));
    const condicaoEstado = (sEstado === '' || tEstado === sEstado);

    if (condicaoNome && condicaoCnpj && condicaoCidade && condicaoEstado) {
      // Telefone exibido na listagem: prioriza celular, cai pro fixo se não tiver
      const telefone = linha[8] || linha[7] || '';

      resultado.push({
        id: linha[0],
        razaoSocial: linha[1],
        nomeFantasia: linha[2],
        cnpj: linha[3],
        telefone: telefone,
        email: linha[6],
        cidade: linha[14],
        estado: linha[15]
      });
    }
  }

  return resultado.length > 0 ? resultado : "NoData";
}