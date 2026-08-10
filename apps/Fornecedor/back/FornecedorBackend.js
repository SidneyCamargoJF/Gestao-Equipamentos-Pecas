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
  //if (!razaoSocial || !nomeFantasia || !cnpj || !inscricaoEstadual || !inscricaoMunicipal ||
      //!cep || !ruaAvenida || !numero || !bairro || !cidade || !estado) {
    //return { sucesso: false, mensagem: 'ERRO: Faltam dados obrigatórios.' };
  //}

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
