function showChamado() {
    const form = HtmlService.createTemplateFromFile("ConsultaChamado");
    const showForm = form.evaluate().setSandboxMode(HtmlService.SandboxMode.IFRAME);
    showForm.setTitle("Consulta de Chamado").setHeight(100).setWidth(1600);
    SpreadsheetApp.getUi().showModalDialog(showForm, "Consulta de Chamado");
}

function filtrarChamados(criterios) {
    let dados = ReadTickets();
    let equipamentos = ReadEquipments();
    let res = [];

    let equipamentoBuscado = (criterios && criterios.equipamento) ? String(criterios.equipamento).trim().toLowerCase() : "";
    let motivoBuscado = (criterios && criterios.motivo) ? String(criterios.motivo).trim().toLowerCase() : "";
    let tipoBuscado = (criterios && criterios.tipo) ? String(criterios.tipo).trim().toLowerCase() : "";
    let prioridadeBuscada = (criterios && criterios.prioridade) ? String(criterios.prioridade).trim().toLowerCase() : "";
    let statusBuscado = (criterios && criterios.status) ? String(criterios.status).trim().toLowerCase() : "";

    for (let i = 0; i < dados.length; i++) {
        // ID_EQUIPAMENTO (dados[i][1]) é só o ID -- traduz pra "Patrimônio - Marca/Modelo"
        // pra mostrar na tabela e pra poder filtrar pelo patrimônio digitado de verdade.
        let equip = equipamentos.find(e => Number(e[0]) === Number(dados[i][1]));
        let equipamentoTexto = equip ? (equip[5] + ' - ' + equip[3] + (equip[4] ? '/' + equip[4] : '')) : '';

        let colEquipamento = equipamentoTexto.toLowerCase();
        let colMotivo = String(dados[i][3] || '').trim().toLowerCase();
        let colTipo = String(dados[i][4] || '').trim().toLowerCase();
        let colPrioridade = String(dados[i][5] || '').trim().toLowerCase();
        let colStatus = String(dados[i][13] || '').trim().toLowerCase();
        let desativado = (colStatus === 'cancelado' || colStatus === 'concluido');

        let cEquipamento = (equipamentoBuscado === "" || colEquipamento.includes(equipamentoBuscado));
        let cMotivo = (motivoBuscado === "" || colMotivo.includes(motivoBuscado));
        let cTipo = (tipoBuscado === "" || colTipo.includes(tipoBuscado));
        let cPrioridade = (prioridadeBuscada === "" || colPrioridade.includes(prioridadeBuscada));
        let cStatus = (statusBuscado === "" || colStatus.includes(statusBuscado));

        if(cEquipamento && cMotivo && cTipo && cPrioridade && cStatus) {
            res.push({
                id: dados[i][0],
                equipamento: equipamentoTexto,
                peca: dados[i][2],
                motivo: dados[i][3],
                tipo: dados[i][4],
                prioridade: dados[i][5],
                atribuidoA: dados[i][7],
                dataAbertura: dados[i][6],
                status: dados[i][13],
                desativado: desativado
            })
        }
    }
    res.sort((a, b) => (a.desativado ? 1 : 0) - (b.desativado ? 1 : 0));
    return res;
}

/**
 * Busca um chamado pelo ID com TODAS as colunas de tbl_chamados, já
 * traduzindo ID_EQUIPAMENTO/ID_PECA pra texto legível (patrimônio/nome),
 * pra alimentar o modal de detalhes (botão "olho" da consulta).
 * Retorna { sucesso, chamado } ou { sucesso: false, mensagem }.
 */
function buscarChamadoDetalhado(idInput) {
    try {
        const idBuscado = Number(idInput);
        const dados = ReadTickets();
        const linha = dados.find(l => Number(l[0]) === idBuscado);
        if (!linha) {
            return { sucesso: false, mensagem: 'Chamado não encontrado (ID ' + idBuscado + ').' };
        }

        let equipamentoTexto = '';
        if (linha[1]) {
            const equipamentos = ReadEquipments();
            const equip = equipamentos.find(e => Number(e[0]) === Number(linha[1]));
            equipamentoTexto = equip ? ('Patrimônio ' + equip[5] + ' - ' + equip[1]) : ('ID ' + linha[1]);
        }

        let pecaTexto = '';
        if (linha[2]) {
            const pecas = ReadParts();
            const nomes = String(linha[2]).split('-').filter(Boolean).map(idPeca => {
                const p = pecas.find(x => Number(x[0]) === Number(idPeca));
                return p ? p[1] : null;
            }).filter(Boolean);
            pecaTexto = nomes.join(', ');
        }

        return {
            sucesso: true,
            chamado: {
                id: linha[0],
                equipamento: equipamentoTexto,
                peca: pecaTexto,
                motivo: linha[3],
                tipo: linha[4],
                prioridade: linha[5],
                dataAbertura: linha[6],
                atribuidoA: linha[7],
                dataInicioAndamento: linha[8],
                dataFinalizacao: linha[9],
                observacao: linha[10],
                relatorioUrl: linha[11],
                notaFiscalUrl: linha[12],
                status: linha[13],
                dataAlteracao: linha[14]
            }
        };
    } catch (e) {
        return { sucesso: false, mensagem: 'Erro no servidor: ' + e.message };
    }
}

function desativarChamado(idInput) {
    try{
        const idBuscado = Number(idInput);
        if (!idBuscado) {
        return { sucesso: false, mensagem: "ID do chamado inválido." };
        }

        const planilha = SpreadsheetApp.getActiveSpreadsheet();
        const abaChamados = planilha.getSheetByName("tbl_chamados");
        if (!abaChamados) {
        return { sucesso: false, mensagem: "Aba 'tbl_chamados' não encontrada na planilha." };
        }

        const dados = ReadTickets();

        for (let i = 0; i < dados.length; i++) {
            if (Number(dados[i][0]) === idBuscado) {
                const linhaReal = i + firstLineTickets;
                const dataAtual = Utilities.formatDate(new Date(), "GMT-3", "dd/MM/yyyy");

                abaChamados.getRange(linhaReal, ticketsDtAlteracaoCol).setValue(dataAtual);
                abaChamados.getRange(linhaReal, ticketsStatusCol).setValue("Cancelado");
                abaChamados.getRange(linhaReal, 1, 1, numColumnsTickets).setBackground("#F4CCCC");
                return { sucesso: true, mensagem: "Chamado desativado com sucesso." };
            }
        }
        return { sucesso: false, mensagem: "Chamado não encontrado (ID " + idBuscado + ")." };
    } catch (e) {
        return { sucesso: false, mensagem: "Erro no servidor: " + e.message };
    }
}

function reativarChamado(idInput) {
    try {
        const idBuscado = Number(idInput);
        if (!idBuscado) {
            return { sucesso: false, mensagem: "ID do chamado inválido." };
        }

        const planilha = SpreadsheetApp.getActiveSpreadsheet();
        const abaChamados = planilha.getSheetByName("tbl_chamados");
        if (!abaChamados) {
            return { sucesso: false, mensagem: "Aba 'tbl_chamados' não encontrada na planilha." };
        }

        const dados = ReadTickets();

        for (let i = 0; i < dados.length; i++) {
            if (Number(dados[i][0]) === idBuscado) {
                const linhaReal = i + firstLineTickets;
                const dataAtual = Utilities.formatDate(new Date(), "GMT-3", "dd/MM/yyyy");

                abaChamados.getRange(linhaReal, ticketsDtAlteracaoCol).setValue(dataAtual);
                abaChamados.getRange(linhaReal, ticketsStatusCol).setValue("Aberto");
                abaChamados.getRange(linhaReal, 1, 1, numColumnsTickets).setBackground(null);
                return { sucesso: true, mensagem: "Chamado reativado com sucesso." };
            }
        }
        return { sucesso: false, mensagem: "Chamado não encontrado (ID " + idBuscado + ")." };
    } catch (e) {
        return { sucesso: false, mensagem: "Erro no servidor: " + e.message };
    }
}

function buscarMotivosUnicosChamado() {
    const dados = ReadTickets();
    const motivos = dados.map(linha => linha[3]).filter(Boolean);
    return [...new Set(motivos)]
}