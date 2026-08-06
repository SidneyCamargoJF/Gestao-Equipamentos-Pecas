

  let fieldNomeForm = document.getElementById('campo-nome')
  let fieldMarcaForm = document.getElementById('campo-marca')
  let fieldValorForm = document.getElementById('campo-valor')
  let fieldNumeroSerieForm = document.getElementById('campo-numero-serie')
  let fieldFornecedorForm = document.getElementById('campo-fornecedor')
  let fieldNotaFiscalForm = document.getElementById('campo-nota-fiscal')
  let fieldDataNotaForm = document.getElementById('campo-data-nota')
  let fieldGarantiaForm = document.getElementById('campo-garantia')
  let fieldModalidadeForm = document.getElementById('campo-modalidade')
  let fieldCapacidadeForm = document.getElementById('campo-capacidade')

  async function renderPecasForm() { // 06/08/2026

    await inicializarPecas()

    consultarPecas()

    document.getElementById('campo-nome').focus();

  }

  function Salvar() {
    // Move os campos para o array para gravação
    let nome  = fieldNomeForm.value
    let marca = fieldMarcaForm.value
    let valor = fieldValorForm.value
    let numeroSerie = fieldNumeroSerieForm.value
    let fornecedor = fieldFornecedorForm.value
    let notaFiscal = fieldNotaFiscalForm.value
    let dataNota   = fieldNotaFiscalForm.value
    let garantia   = fieldGarantiaForm.value
    let modalidade = fieldModalidadeForm.value
    let capacidade = fieldCapacidadeForm.value

    nome = nome.trim()
    marca = marca.trim()
    valor = valor.trim()
    numeroSerie = numeroSerie.trim()
    fornecedor = fornecedor.trim()
    notaFiscal = notaFiscal.trim()
    dataNota = dataNota.trim()
    garantia = garantia.trim()
    modalidade = modalidade.trim()
    capacidade = capacidade.trim()

    if ( isEmpty(nome) || isEmpty(marca) || isEmpty(valor) || isEmpty(numeroSerie) ||
      isEmpty(fornecedor) || isEmpty(notaFiscal) || isEmpty(dataNota) ||
      isEmpty(garantia) || isEmpty(modalidade) || isEmpty(capacidade)) {
      // showMessage(Necessita preencher todos os campos, 'OK');
      console.log('isEmpty')
      return false;
    }

    let Dados = {
      Nome: nome,
      Marca: marca,
      Valor: valor,
      NumeroSerie: numeroSerie,
      Fornecedor: fornecedor,
      NotaFiscal: notaFiscal,
      DataNota: dataNota,
      Garantia: garantia,
      Modalidade: modalidade,
      Capacidade: capacidade
    }

    google.script.run.withSuccessHandler(Retorno).SalvarPecas(Dados)

    console.log('salvar')
  }

  function Retorno(r) {
    console.log('retorno')
    if (r == "PEÇA JA CADASTRADA") {
      let m = "PEÇA JÁ CADASTRADA"
      console.log(m)
      return false
    }



  }

</script>
