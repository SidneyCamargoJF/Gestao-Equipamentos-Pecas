function converterParaInputDateEquip_(valorCelula) {
  if (!valorCelula) return '';

  if (valorCelula instanceof Date) {
    return Utilities.formatDate(valorCelula, 'GMT-3', 'yyyy-MM-dd');
  }

  const texto = String(valorCelula).trim();
  if (!texto) return '';

  if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) return texto;

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(texto)) {
    const partes = texto.split('/');
    return partes[2] + '-' + partes[1] + '-' + partes[0];
  }

  return texto;
}

function formatarDataExibicaoEquip_(valorCelula) {
  if (!valorCelula) return '';
  if (valorCelula instanceof Date) {
    return Utilities.formatDate(valorCelula, 'GMT-3', 'dd/MM/yyyy');
  }
  const texto = String(valorCelula).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
    const partes = texto.split('-');
    return partes[2] + '/' + partes[1] + '/' + partes[0];
  }
  return texto;
}

// Status da garantia ("vencida"/"vencendo"/"ativa") pro badge da Consulta --
// mesma lógica/helpers já usados em Peças (statusGarantia/calculaDias,
// apps/Helper/back/HelperDate.js). Devolve '' se não tiver data de garantia.
function calcularStatusGarantiaEquip_(valorCelula) {
  if (!valorCelula) return '';

  let data = null;
  if (valorCelula instanceof Date) {
    data = valorCelula;
  } else {
    const texto = String(valorCelula).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
      data = new Date(texto + 'T00:00:00');
    } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(texto)) {
      data = stringToDate(texto);
    }
  }

  if (!data || isNaN(data)) return '';

  const dias = calculaDias(data, new Date());
  return statusGarantia(dias);
}

function filtrarEquipamentos(criterios) {
  criterios = criterios || {};
  const model = new EquipmentsModel();
  const linhas = ReadSheet('tbl_equipamentos', 3, model.numColumns);

  // Nome e Patrimônio foram unidos num campo só na Consulta -- um termo que
  // bate em qualquer um dos dois já é suficiente (filtro "OU", não "E").
  const nomeOuPatrimonioBusca = String(criterios.nome || '').trim().toLowerCase();
  const capacidadeBusca = String(criterios.capacidade || '').replace(/\D/g, '');
  const marcaBusca = String(criterios.marca || '').trim().toLowerCase();
  const localizacaoBusca = String(criterios.localizacao || '').trim().toLowerCase();
  const seiBusca = String(criterios.sei || '').trim().toLowerCase();

  const res = linhas
    .map(l => ({
      id: l[model.colId],
      patrimonio: String(l[model.colPatrimonio] || '').trim(),
      nome: String(l[model.colNome] || '').trim(),
      marca: String(l[model.colMarca] || '').trim(),
      capacidade: String(l[model.colCapacidade] || '').trim(),
      modelo: String(l[model.colModelo] || '').trim(),
      sequencia: String(l[model.colSequencia] || '').trim(),
      localizacao: String(l[model.colLocalizacao] || '').trim(),
      fornecedor: String(l[model.colFornecedor] || '').trim(),
      sei: String(l[model.colSei] || '').trim(),
      garantia: calcularStatusGarantiaEquip_(l[model.colDataGarantia]),
      desativada: !!(l[model.colDtExclusao] && String(l[model.colDtExclusao]).trim() !== '')
    }))
    .filter(eq => eq.nome || eq.patrimonio)
    .filter(eq => nomeOuPatrimonioBusca === '' || eq.nome.toLowerCase().includes(nomeOuPatrimonioBusca) || eq.patrimonio.toLowerCase().includes(nomeOuPatrimonioBusca))
    .filter(eq => capacidadeBusca === '' || eq.capacidade.replace(/\D/g, '').includes(capacidadeBusca))
    .filter(eq => marcaBusca === '' || eq.marca.toLowerCase().includes(marcaBusca))
    .filter(eq => localizacaoBusca === '' || eq.localizacao.toLowerCase().includes(localizacaoBusca))
    .filter(eq => seiBusca === '' || eq.sei.toLowerCase().includes(seiBusca));

  res.sort((a, b) => (a.desativada ? 1 : 0) - (b.desativada ? 1 : 0));

  return res;
}

function buscarNomesUnicosEquipamento() {
  const model = new EquipmentsModel();
  const linhas = ReadSheet('tbl_equipamentos', 3, model.numColumns);
  const nomes = linhas.map(l => String(l[model.colNome] || '').trim()).filter(Boolean);
  return [...new Set(nomes)];
}

function buscarEquipamentoParaEdicao(idInput) {
  try {
    const id = Number(idInput);
    if (!id) return { sucesso: false, mensagem: "ID do equipamento inválido." };

    const model = new EquipmentsModel();
    const linhas = ReadSheet('tbl_equipamentos', 3, model.numColumns);

    for (let i = 0; i < linhas.length; i++) {
      if (Number(linhas[i][model.colId]) === id) {
        const l = linhas[i];
        return {
          sucesso: true,
          equipamento: {
            id: l[model.colId],
            patrimonio: String(l[model.colPatrimonio] || ''),
            nome: String(l[model.colNome] || ''),
            marca: String(l[model.colMarca] || ''),
            capacidade: String(l[model.colCapacidade] || ''),
            modelo: String(l[model.colModelo] || ''),
            sequencia: String(l[model.colSequencia] || ''),
            localizacao: String(l[model.colLocalizacao] || ''),
            fornecedor: String(l[model.colFornecedor] || ''),
            dataEntrada: converterParaInputDateEquip_(l[model.colDataEntrada]),
            notaFiscal: String(l[model.colNotaFiscal] || ''),
            sei: String(l[model.colSei] || ''),
            dataGarantia: converterParaInputDateEquip_(l[model.colDataGarantia]),
            valorAquisicao: l[model.colValorAquisicao] || '',
            observacoes: String(l[model.colObservacoes] || '')
          }
        };
      }
    }
    return { sucesso: false, mensagem: "Equipamento não encontrado." };
  } catch (e) {
    return { sucesso: false, mensagem: "Erro no servidor: " + e.message };
  }
}

function buscarEquipamentoDetalhado(idInput) {
  try {
    const id = Number(idInput);
    if (!id) return { sucesso: false, mensagem: "ID do equipamento inválido." };

    const model = new EquipmentsModel();
    const linhas = ReadSheet('tbl_equipamentos', 3, model.numColumns);

    for (let i = 0; i < linhas.length; i++) {
      if (Number(linhas[i][model.colId]) === id) {
        const l = linhas[i];
        return {
          sucesso: true,
          equipamento: {
            id: l[model.colId],
            patrimonio: String(l[model.colPatrimonio] || ''),
            nome: String(l[model.colNome] || ''),
            marca: String(l[model.colMarca] || ''),
            capacidade: String(l[model.colCapacidade] || ''),
            modelo: String(l[model.colModelo] || ''),
            sequencia: String(l[model.colSequencia] || ''),
            localizacao: String(l[model.colLocalizacao] || ''),
            fornecedor: String(l[model.colFornecedor] || ''),
            dataEntrada: formatarDataExibicaoEquip_(l[model.colDataEntrada]),
            notaFiscal: String(l[model.colNotaFiscal] || ''),
            sei: String(l[model.colSei] || ''),
            dataGarantia: formatarDataExibicaoEquip_(l[model.colDataGarantia]),
            valorAquisicao: l[model.colValorAquisicao] || '',
            observacoes: String(l[model.colObservacoes] || ''),
            dtCadastro: formatarDataExibicaoEquip_(l[model.colDtCadastro]),
            dtAlteracao: formatarDataExibicaoEquip_(l[model.colDtAlteracao]),
            desativado: !!(l[model.colDtExclusao] && String(l[model.colDtExclusao]).trim() !== '')
          }
        };
      }
    }
    return { sucesso: false, mensagem: "Equipamento não encontrado." };
  } catch (e) {
    return { sucesso: false, mensagem: "Erro no servidor: " + e.message };
  }
}

function salvarEquipamento(dados) {
  try {
    dados = dados || {};
    const nome = String(dados.nome || '').trim();
    const marca = String(dados.marca || '').trim();
    const patrimonio = String(dados.patrimonio || '').trim();

    if (!nome) return { sucesso: false, mensagem: "Informe o nome do equipamento." };
    if (!marca) return { sucesso: false, mensagem: "Informe a marca." };
    if (!patrimonio) return { sucesso: false, mensagem: "Informe o patrimônio." };

    const model = new EquipmentsModel();
    const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('tbl_equipamentos');
    if (!aba) return { sucesso: false, mensagem: "Aba 'tbl_equipamentos' não foi encontrada na planilha." };

    const linhas = ReadSheet('tbl_equipamentos', 3, model.numColumns);
    const idEdicao = Number(dados.id) || 0;
    const dataHoje = Utilities.formatDate(new Date(), 'GMT-3', 'dd/MM/yyyy');

    for (let i = 0; i < linhas.length; i++) {
      const linhaAtiva = !(linhas[i][model.colDtExclusao] && String(linhas[i][model.colDtExclusao]).trim() !== '');
      const mesmoPatrimonio = String(linhas[i][model.colPatrimonio] || '').trim().toLowerCase() === patrimonio.toLowerCase();
      const idLinha = Number(linhas[i][model.colId]);

      if (mesmoPatrimonio && linhaAtiva && idLinha !== idEdicao) {
        return { sucesso: false, mensagem: "Já existe um equipamento ativo com esse patrimônio." };
      }
    }

    if (idEdicao) {
      for (let i = 0; i < linhas.length; i++) {
        if (Number(linhas[i][model.colId]) === idEdicao) {
          const linhaReal = i + 3;
          aba.getRange(linhaReal, model.colNome + 1).setValue(nome);
          aba.getRange(linhaReal, model.colMarca + 1).setValue(marca);
          aba.getRange(linhaReal, model.colCapacidade + 1).setValue(dados.capacidade || '');
          aba.getRange(linhaReal, model.colModelo + 1).setValue(dados.modelo || '');
          aba.getRange(linhaReal, model.colPatrimonio + 1).setValue(patrimonio);
          aba.getRange(linhaReal, model.colSequencia + 1).setValue(dados.sequencia || '');
          aba.getRange(linhaReal, model.colLocalizacao + 1).setValue(dados.localizacao || '');
          aba.getRange(linhaReal, model.colFornecedor + 1).setValue(dados.fornecedor || '');
          aba.getRange(linhaReal, model.colDataEntrada + 1).setValue(dados.dataEntrada || '');
          aba.getRange(linhaReal, model.colNotaFiscal + 1).setValue(dados.notaFiscal || '');
          aba.getRange(linhaReal, model.colSei + 1).setValue(dados.sei || '');
          aba.getRange(linhaReal, model.colDataGarantia + 1).setValue(dados.dataGarantia || '');
          aba.getRange(linhaReal, model.colValorAquisicao + 1).setValue(dados.valorAquisicao || '');
          aba.getRange(linhaReal, model.colObservacoes + 1).setValue(dados.observacoes || '');
          aba.getRange(linhaReal, model.colDtAlteracao + 1).setValue(dataHoje);
          return { sucesso: true, mensagem: "Equipamento atualizado com sucesso!", id: idEdicao };
        }
      }
      return { sucesso: false, mensagem: "Equipamento não encontrado pra edição." };
    }

    let maiorId = 0;
    linhas.forEach(l => {
      const idLinha = Number(l[model.colId]);
      if (idLinha > maiorId) maiorId = idLinha;
    });
    const novoId = maiorId + 1;

    const novaLinha = [];
    novaLinha[model.colId] = novoId;
    novaLinha[model.colNome] = nome;
    novaLinha[model.colMarca] = marca;
    novaLinha[model.colCapacidade] = dados.capacidade || '';
    novaLinha[model.colModelo] = dados.modelo || '';
    novaLinha[model.colPatrimonio] = patrimonio;
    novaLinha[model.colSequencia] = dados.sequencia || '';
    novaLinha[model.colLocalizacao] = dados.localizacao || '';
    novaLinha[model.colFornecedor] = dados.fornecedor || '';
    novaLinha[model.colDataEntrada] = dados.dataEntrada || '';
    novaLinha[model.colNotaFiscal] = dados.notaFiscal || '';
    novaLinha[model.colSei] = dados.sei || '';
    novaLinha[model.colDataGarantia] = dados.dataGarantia || '';
    novaLinha[model.colValorAquisicao] = dados.valorAquisicao || '';
    novaLinha[model.colObservacoes] = dados.observacoes || '';
    novaLinha[model.colActive] = 'Y';
    novaLinha[model.colDtCadastro] = dataHoje;
    novaLinha[model.colDtAlteracao] = '';
    novaLinha[model.colDtExclusao] = '';

    aba.appendRow(novaLinha);
    const novaUltimaLinha = aba.getLastRow();
    aba.getRange(novaUltimaLinha, 1, 1, model.numColumns).setBackground('#FFFFFF');

    return { sucesso: true, mensagem: "Equipamento cadastrado com sucesso!", id: novoId };
  } catch (e) {
    return { sucesso: false, mensagem: "Erro no servidor: " + e.message };
  }
}

function desativarEquipamento(idInput) {
  try {
    const id = Number(idInput);
    if (!id) return { sucesso: false, mensagem: "ID do equipamento inválido." };

    const model = new EquipmentsModel();
    const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('tbl_equipamentos');
    if (!aba) return { sucesso: false, mensagem: "Aba 'tbl_equipamentos' não foi encontrada." };

    const linhas = ReadSheet('tbl_equipamentos', 3, model.numColumns);
    for (let i = 0; i < linhas.length; i++) {
      if (Number(linhas[i][model.colId]) === id) {
        const linhaReal = i + 3;
        const dataHoje = Utilities.formatDate(new Date(), 'GMT-3', 'dd/MM/yyyy');
        aba.getRange(linhaReal, model.colDtExclusao + 1).setValue(dataHoje);
        aba.getRange(linhaReal, model.colActive + 1).setValue('N');
        aba.getRange(linhaReal, 1, 1, model.numColumns).setBackground('#F4CCCC');
        return { sucesso: true, mensagem: "Equipamento desativado com sucesso!" };
      }
    }
    return { sucesso: false, mensagem: "Equipamento não encontrado." };
  } catch (e) {
    return { sucesso: false, mensagem: "Erro no servidor: " + e.message };
  }
}

function reativarEquipamento(idInput) {
  try {
    const id = Number(idInput);
    if (!id) return { sucesso: false, mensagem: "ID do equipamento inválido." };

    const model = new EquipmentsModel();
    const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('tbl_equipamentos');
    if (!aba) return { sucesso: false, mensagem: "Aba 'tbl_equipamentos' não foi encontrada." };

    const linhas = ReadSheet('tbl_equipamentos', 3, model.numColumns);
    for (let i = 0; i < linhas.length; i++) {
      if (Number(linhas[i][model.colId]) === id) {
        const linhaReal = i + 3;
        aba.getRange(linhaReal, model.colDtExclusao + 1).clearContent();
        aba.getRange(linhaReal, model.colActive + 1).setValue('Y');
        aba.getRange(linhaReal, 1, 1, model.numColumns).setBackground('#FFFFFF');
        return { sucesso: true, mensagem: "Equipamento reativado com sucesso!" };
      }
    }
    return { sucesso: false, mensagem: "Equipamento não encontrado." };
  } catch (e) {
    return { sucesso: false, mensagem: "Erro no servidor: " + e.message };
  }
}
