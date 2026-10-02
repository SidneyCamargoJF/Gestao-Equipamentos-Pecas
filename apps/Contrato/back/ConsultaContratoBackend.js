function filtrarContratos(criterios) {
  let dados = ReadContracts();
  let res = [];

  let numeroBuscado = (criterios && criterios.numero) ? String(criterios.numero).trim().toLowerCase() : "";
  let nomeBuscado = (criterios && criterios.contrato) ? String(criterios.contrato).trim().toLowerCase() : "";
  let seiBuscado = (criterios && criterios.sei) ? String(criterios.sei).trim().toLowerCase() : "";
  let empresaBuscada = (criterios && criterios.empresa) ? String(criterios.empresa).trim().toLowerCase() : "";
  let situacaoBuscada = (criterios && criterios.situacao) ? String(criterios.situacao).trim().toLowerCase() : "";

  let hoje = new Date();

  for (let i = 0; i < dados.length; i++) {
    let linha = dados[i];
    if (!linha[contractIdCol]) continue;

    let colNumero = String(linha[contractNumberCol] || '').trim().toLowerCase();
    let colSei = String(linha[contractSEICol] || '').trim().toLowerCase();
    let colEmpresa = String(linha[contractEmpresaCol] || '').trim().toLowerCase();

    let dtFinal = linha[contractDtEndCol] ? new Date(linha[contractDtEndCol]) : null;
    let diasParaVencer = dtFinal ? Math.floor((dtFinal - hoje) / (1000 * 60 * 60 * 24)) : null;
    let situacao = 'ativo';
    if (dtFinal) {
      if (diasParaVencer < 0) situacao = 'vencido';
      else if (diasParaVencer <= 30) situacao = 'vencendo';
    }

    // "Nome do Contrato" (objeto/descrição) ainda não tem coluna própria em
    // tbl_contrato -- fica em aberto até o Módulo 2 (expansão do backend).
    let colNome = '';

    let cNumero = (numeroBuscado === "" || colNumero.includes(numeroBuscado));
    let cNome = (nomeBuscado === "" || colNome.includes(nomeBuscado));
    let cSei = (seiBuscado === "" || colSei.includes(seiBuscado));
    let cEmpresa = (empresaBuscada === "" || colEmpresa.includes(empresaBuscada));
    let cSituacao = (situacaoBuscada === "" || situacao === situacaoBuscada);

    if (cNumero && cNome && cSei && cEmpresa && cSituacao) {
      res.push({
        id: linha[contractIdCol],
        numero: linha[contractNumberCol],
        contrato: colNome,
        sei: linha[contractSEICol],
        empresa: linha[contractEmpresaCol],
        telefone: linha[contractTelefoneCol],
        email: linha[contractEMailCol],
        valor: linha[contractValueCol],
        dataInicial: linha[contractDtInitCol],
        dataFinal: linha[contractDtEndCol],
        renovadoAte: linha[contractRenewed],
        situacao: situacao
      });
    }
  }

  return res;
}

function desativarContrato(id) {
  // ContratoModel.js diz numColumnsContracts = 14, mas só as colunas 0-10
  // têm nome (id/numero/sei/data/empresa/telefone/email/valor/dtInicial/
  // dtFinal/renovado). As colunas 11, 12 e 13 existem na planilha mas
  // ninguém documentou o que são -- pode já ter um "desativado" ali, ou
  // pode ser outra coisa. Em vez de chutar e arriscar escrever em cima do
  // dado errado (igual já aconteceu antes), deixei isso parado até você
  // confirmar o que tem nessas 3 colunas.
  return { sucesso: false, mensagem: 'Exclusão de contrato ainda não implementada -- falta confirmar a coluna de status/desativado em tbl_contrato.' };
}
