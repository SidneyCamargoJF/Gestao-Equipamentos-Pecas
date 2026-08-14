function showMarca() {
  const form = HtmlService.createTemplateFromFile("ConsultaMarcaForm");
  const showForm = form.evaluate().setSandboxMode(HtmlService.SandboxMode.IFRAME);
  showForm.setTitle("Consulta de Marcas").setHeight(900).setWidth(800);
  SpreadsheetApp.getUi().showModalDialog(showForm, "Consulta de Marcas");
}


function filtrarMarcas(criterios) {
  let dados = ReadBrands();
  let res = [];

  let marcaBuscada = (criterios && criterios.marca) ? criterios.marca.trim().toLowerCase() : "";

  for (let i = 0; i < dados.length; i++) {
    let idMarca = dados[i][0];
    let nomeMarca = dados[i][1] ? String(dados[i][1]).trim() : "";
    let valorColunaExclusao = String(dados[i][3]).trim();

    if (!nomeMarca) continue;

    let bateuBusca = (marcaBuscada === "" || nomeMarca.toLowerCase().includes(marcaBuscada));

    let estaDesativada =  (
      valorColunaExclusao !== ""
    );


    if (bateuBusca) {
      res.push({
        id: idMarca,
        marca: nomeMarca,
        desativada: estaDesativada
      });
    }
  }

  res.sort((a, b) => (a.desativada ? 1 : 0) - (b.desativada ? 1 : 0));

  return res;
}

function cadastrarMarca(nomeMarcaInput) {
  try {
    const nomeMarca = (nomeMarcaInput || "").toString().trim();

    if (nomeMarca === "") {
      return { sucesso: false, mensagem: "Digite o nome da marca." };
    }

    const planilha = SpreadsheetApp.getActiveSpreadsheet();
    const abaConsultaMarca = planilha.getSheetByName(brandTableName);

    if (!abaConsultaMarca) {
      return { sucesso: false, mensagem: "Aba '" + brandTableName + "' não foi encontrada na planilha." };
    }

    const ultimaLinha = abaConsultaMarca.getLastRow();
    const dataHoje = Utilities.formatDate(new Date(), "GMT-3", "dd/MM/yyyy");

    if (ultimaLinha >= firstLineBrands) {
      const numLinhas = ultimaLinha - (firstLineBrands - 1);
      const dadosMarcas = abaConsultaMarca.getRange(firstLineBrands, 1, numLinhas, numColumnsBrands).getValues();
      let linhaInativaEncontrada = -1;

      for (let i = 0; i < dadosMarcas.length; i++) {
        const nomeTabela = dadosMarcas[i][brandNameCol] ? dadosMarcas[i][brandNameCol].toString().trim().toLowerCase() : "";
        const dataExclusaoTabela = dadosMarcas[i][brandDtExclusaoCol] ? dadosMarcas[i][brandDtExclusaoCol].toString().trim() : "";

        if (nomeTabela === nomeMarca.toLowerCase()) {
          if (dataExclusaoTabela === "") {
            return { sucesso: false, mensagem: "Esta marca já está cadastrada e ativa no sistema." };
          } else {
            linhaInativaEncontrada = i + firstLineBrands;
          }
        }
      }

      // Reativar marca excluída
      if (linhaInativaEncontrada !== -1) {
        // Coluna 4 (brandDtExclusaoCol + 1) e Coluna 5 (brandDtAlteracaoCol + 1)
        abaConsultaMarca.getRange(linhaInativaEncontrada, brandDtExclusaoCol + 1).clearContent();
        abaConsultaMarca.getRange(linhaInativaEncontrada, brandDtAlteracaoCol + 1).setValue(dataHoje);
        abaConsultaMarca.getRange(linhaInativaEncontrada, 1, 1, numColumnsBrands).setBackground("#FFFFFF");

        return { sucesso: true, mensagem: "Esta marca já existia e foi reativada com sucesso!" };
      }
    }

    // Cálculo do novo ID (Soma 1 em brandIdCol para pegar a coluna 1 da planilha)
    let id = 1;
    if (ultimaLinha >= firstLineBrands) {
      const ultimoId = abaConsultaMarca.getRange(ultimaLinha, brandIdCol + 1).getValue();
      id = Number(ultimoId) + 1;
    }

    // Insere nova linha [ID, Nome, Data Cadastro, Data Exclusão, Data Alteração]
    abaConsultaMarca.appendRow([id, nomeMarca, dataHoje, "", ""]);
    const novaUltimaLinha = abaConsultaMarca.getLastRow();
    abaConsultaMarca.getRange(novaUltimaLinha, 1, 1, numColumnsBrands).setBackground("#FFFFFF");

    return { sucesso: true, mensagem: "Marca cadastrada com sucesso!" };

  } catch (e) {
    return { sucesso: false, mensagem: "Erro no servidor: " + e.message };
  }
}

// desativarMarca() agora vive em apps/Model/back/MarcasModel.js (usada pelo
// ExcluirRegistro genérico em Model.js) -- não duplicar aqui.

function editarMarca(idMarcaInput, novoNome) {
  try {
    const idMarca = Number(idMarcaInput);

    if (!idMarca) {
      return { sucesso: false, mensagem: "ID da marca inválido." };
    }

    if (!novoNome || novoNome.trim() === "") {
      return { sucesso: false, mensagem: "O nome da marca não pode ser vazio." };
    }

    const planilha = SpreadsheetApp.getActiveSpreadsheet();
    const abaConsultaMarca = planilha.getSheetByName('tbl_marca');

    if (!abaConsultaMarca) {
      Logger.log("Aba 'tbl_marca' não foi encontrada na planilha.");
      return { sucesso: false, mensagem: "Aba 'tbl_marca' não encontrada." };
    }

    const dadosMarcas = ReadBrands();
    let linhaLocalizada = -1;

    for (let i = 0; i < dadosMarcas.length; i++) {
      if (Number(dadosMarcas[i][0]) === idMarca) {
        linhaLocalizada = i + firstLineBrands;
        break;
      }
    }

    if (linhaLocalizada !== -1) {
      const dataHoje = Utilities.formatDate(new Date(), "GMT-3", "dd/MM/yyyy");

      abaConsultaMarca.getRange(linhaLocalizada, 2).setValue(novoNome.trim());

      abaConsultaMarca.getRange(linhaLocalizada, 5).setValue(dataHoje);

      Logger.log("Marca ID " + idMarca + " editada na linha " + linhaLocalizada);
      return {
        sucesso: true,
        mensagem: "Marca editada com sucesso.",
        id: idMarca,
        marca: novoNome.trim()
      };

    } else {
      Logger.log("Marca não encontrada para o ID: " + idMarca);
      return { sucesso: false, mensagem: "Marca não encontrada na planilha." };
    }
  } catch (e) {
    Logger.log("Erro no servidor ao editar marca: " + e.message);
    return { sucesso: false, mensagem: "Erro no servidor: " + e.message };
  }
}
