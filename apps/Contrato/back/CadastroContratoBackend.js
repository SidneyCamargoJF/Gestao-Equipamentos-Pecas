function salvarContratoBackend (dados) {
  try {
    if (!dados) {
      return { sucesso: false, mensagem: 'Dados do contrato não informados.' };
    }

    const camposObrigatorios = [
      { campo: 'numero', rotulo: 'Número' }, { campo: 'contrato', rotulo: 'Nome do Contrato' },
      { campo: 'empresa', rotulo: 'Empresa' }, { campo: 'sei', rotulo:'Documento SEI'},
      { campo: 'data', rotulo:'Data do fechamento do contrato'}, { campo: 'situacao', rotulo:'Situação'},
      { campo: 'objeto', rotulo: 'Objeto do Contrato'}, { campo: 'dataInicial', rotulo: 'Data Inicial'},
      { campo: 'dataFinal', rotulo: 'Data Final'}, { campo: 'telefone', rotulo: 'Telefone'},
      { campo: 'email', rotulo:'E-mail'}, { campo: 'gestor', rotulo:'Gestor do Contrato'}
    ]

    for(let i = 0; i < camposObrigatorios.length; i++) {
      const item = camposObrigatorios[i]
      if (!String(dados[item.campo] || '').trim()) {
        return { sucesso: false, mensagem: 'Preencha o campo ' + item.rotulo + '.' }
      }
    }


  } catch (e) {
    return { sucesso: false, mensagem: 'Erro no servidor: ' + e.message };
  }
}