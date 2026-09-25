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
        // ID_EQUIPAMENTO (dados[i][1]) é só o ID -- traduz pra "Patrimônio - Nome/Modelo"
        // pra mostrar na tabela e pra poder filtrar pelo patrimônio digitado de verdade.
        let equip = equipamentos.find(e => Number(e[0]) === Number(dados[i][1]));
        let equipamentoTexto = equip ? (equip[5] + ' - ' + equip[1] + (equip[4] ? '/' + equip[4] : '')) : '';

        let colEquipamento = equipamentoTexto.toLowerCase();
        let colMotivo = String(dados[i][2] || '').trim().toLowerCase();
        let colTipo = String(dados[i][3] || '').trim().toLowerCase();
        let colPrioridade = String(dados[i][4] || '').trim().toLowerCase();
        let colStatus = String(dados[i][11] || '').trim().toLowerCase();
        let desativado = (colStatus === 'cancelado' || colStatus === 'concluido');
        let concluido = (colStatus === 'concluido');

        let cEquipamento = (equipamentoBuscado === "" || colEquipamento.includes(equipamentoBuscado));
        let cMotivo = (motivoBuscado === "" || colMotivo.includes(motivoBuscado));
        let cTipo = (tipoBuscado === "" || colTipo.includes(tipoBuscado));
        let cPrioridade = (prioridadeBuscada === "" || colPrioridade.includes(prioridadeBuscada));
        let cStatus = (statusBuscado === "" || colStatus.includes(statusBuscado));

        if(cEquipamento && cMotivo && cTipo && cPrioridade && cStatus) {
            res.push({
                id: dados[i][0],
                equipamento: equipamentoTexto,
                localizacao: equip ? equip[7] : '',
                motivo: dados[i][2],
                tipo: dados[i][3],
                prioridade: dados[i][4],
                abertoPor: dados[i][6],
                atribuidoA: dados[i][7],
                dataAbertura: dados[i][5],
                status: dados[i][11],
                desativado: desativado,
                concluido: concluido
            })
        }
    }
    res.sort((a, b) => (a.desativado ? 1 : 0) - (b.desativado ? 1 : 0));
    return res;
}

/**
 * Busca um chamado pelo ID com TODAS as colunas de tbl_chamados, já
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
            equipamentoTexto = equip
                ? ('Patrimônio ' + equip[5] + ' - ' + equip[1] + (equip[4] ? '/' + equip[4] : '') + (equip[7] ? ' (' + equip[7] + ')' : ''))
                : ('ID ' + linha[1]);
        }

        const chamado = {
            id: linha[0],
            equipamento: equipamentoTexto,
            motivo: linha[2],
            tipo: linha[3],
            prioridade: linha[4],
            dataAbertura: linha[5],
            abertoPor: linha[6],
            atribuidoA: linha[7],
            dataInicioAndamento: linha[8],
            dataFinalizacao: linha[9],
            observacao: linha[10],
            status: linha[11],
            dataAlteracao: linha[12]
        };

        return { sucesso: true, chamado: chamado };
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
                adicionarHistoricoSistema(idBuscado, 'Chamado desativado');
                return { sucesso: true, mensagem: "Chamado desativado com sucesso." };
            }
        }
        return { sucesso: false, mensagem: "Chamado não encontrado (ID " + idBuscado + ")." };
    } catch (e) {
        return { sucesso: false, mensagem: "Erro no servidor: " + e.message };
    }
}

/**
 * Muda o status do chamado (Aberto / Em Andamento / Concluído -- botões do
 * modal de detalhes). Preenche DATA_INICIO_ANDAMENTO ou DATA_FINALIZACAO
 * quando faz sentido, e registra a troca no histórico.
 */
function alterarStatusChamado(idInput, novoStatus) {
    try {
        const idBuscado = Number(idInput);
        if (!idBuscado) {
            return { sucesso: false, mensagem: "ID do chamado inválido." };
        }

        // "Concluido" sem acento de propósito -- bate com o value="concluido"
        // do filtro de Status da Consulta e com o "=== 'concluido'" que já
        // existe em filtrarChamados (comparação exata, sem acento quebraria).
        const statusValidos = ['Aberto', 'Em Andamento', 'Concluido'];
        if (statusValidos.indexOf(novoStatus) === -1) {
            return { sucesso: false, mensagem: "Status inválido." };
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

                abaChamados.getRange(linhaReal, ticketsStatusCol).setValue(novoStatus);
                abaChamados.getRange(linhaReal, ticketsDtAlteracaoCol).setValue(dataAtual);

                if (novoStatus === 'Em Andamento') {
                    abaChamados.getRange(linhaReal, ticketsDtInicioAndamentoCol).setValue(dataAtual);
                }
                if (novoStatus === 'Concluido') {
                    abaChamados.getRange(linhaReal, ticketsDtFinalizacaoCol).setValue(dataAtual);
                }

                adicionarHistoricoSistema(idBuscado, 'Status alterado para "' + novoStatus + '".');
                return { sucesso: true, mensagem: 'Status atualizado para "' + novoStatus + '".' };
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
                adicionarHistoricoSistema(idBuscado, 'Chamado reativado');
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
    const motivos = dados.map(linha => linha[2]).filter(Boolean);
    return [...new Set(motivos)]
}

/**
 * Lista as entradas de tbl_chamado_historico de um chamado (aba Histórico
 * do modal de detalhes), mais recente primeiro. Cada entrada vem com
 * "tipo" pra a tela colorir/mostrar botão de excluir diferente:
 * - 'sistema': gerada automaticamente (abertura, troca de status,
 *   reativação...) -- imutável, sem botão de excluir.
 * - 'alerta': igual sistema, mas destacada em vermelho (chamado desativado).
 * - 'anotacao': digitada manualmente por alguém -- pode ser excluída.
 */
function buscarHistoricoChamado(chamadoId) {
    const idBuscado = Number(chamadoId);
    const dados = ReadTicketHistorico();

    return dados
        .filter(linha => Number(linha[1]) === idBuscado)
        .filter(linha => String(linha[2] || '').indexOf(HISTORICO_CHAMADO_PREFIXO_EXCLUIDA) !== 0)
        .map(linha => {
            const textoOriginal = String(linha[2] || '');
            const ehSistema = textoOriginal.indexOf(HISTORICO_CHAMADO_PREFIXO_SISTEMA) === 0;
            const textoLimpo = ehSistema ? textoOriginal.slice(HISTORICO_CHAMADO_PREFIXO_SISTEMA.length) : textoOriginal;

            let tipo = 'anotacao';
            if (ehSistema) {
                tipo = (textoLimpo === 'Chamado desativado') ? 'alerta' : 'sistema';
            }

            return { id: linha[0], texto: textoLimpo, data: linha[3], tipo: tipo };
        })
        .reverse();
}

function buscarAnexosChamado (chamadoId) {
    const idBuscado = Number(chamadoId);
    const dados = ReadTicketAnexos()

    return dados
        .filter(linha => Number(linha[1]) === idBuscado)
        .filter(linha => !linha[6])
        .map(linha => ({
            id: linha[0],
            tipo: linha[2],
            nomeArquivo: linha[3],
            url: linha[4],
            dataUpload: linha[5]
        }))
        .reverse();
}

/**
 * Adiciona uma anotação manual ao histórico do chamado (aba Histórico --
 * campo de texto livre, tipo "Serviço acompanhado no período da manhã").
 * Reaproveita adicionarHistoricoChamado (mesma função usada ao abrir o
 * chamado), sem o prefixo de sistema -- por isso entra como tipo
 * "anotacao" (editável/excluível) quando lida de volta.
 */
function adicionarAnotacaoChamado(chamadoId, texto) {
    const textoLimpo = String(texto || '').trim();
    if (!textoLimpo) {
        return { sucesso: false, mensagem: 'Escreva algo antes de adicionar.' };
    }

    adicionarHistoricoChamado(chamadoId, textoLimpo);
    return { sucesso: true, mensagem: 'Anotação adicionada.' };
}

function editarAnotacaoChamado(historicoId, novoTexto) {
    try {
        const ss = SpreadsheetApp.getActiveSpreadsheet();
        const abaHistorico = ss.getSheetByName(ticketHistoricoTableName);
        const dataAlt = Utilities.formatDate(new Date(), "GMT-3", "dd/MM/yyyy");
        const dados = ReadTicketHistorico();
        if (!abaHistorico) {
            return {sucesso: false, mensagem: "Aba 'tbl_chamado_historico' não encontrada na planilha." };
        }

        const textoLimpo = String (novoTexto || '').trim();
        if (!textoLimpo) {
            return { sucesso: false, mensagem: 'Escreva algo antes de salvar.' };
        }
        

        for (let i = 0; i < dados.length; i++) {
            if (Number(dados[i][0]) === Number(historicoId)) {
                let textoOriginal = String(dados[i][2] || '');
                if (textoOriginal.indexOf(HISTORICO_CHAMADO_PREFIXO_SISTEMA) === 0) {
                    return { sucesso: false, mensagem: 'Não é possível editar um registro do sistema.' };
                }
                const linhaReal = i + firstLineTicketHistorico;
                abaHistorico.getRange(linhaReal, 3).setValue(textoLimpo);
                abaHistorico.getRange(linhaReal, 5).setValue(dataAlt);
                return { sucesso: true, mensagem: 'Anotação editada.' };
            }
        }
        return { sucesso: false, mensagem: 'Anotação não encontrada.' };
    } catch (e) {
        return { sucesso: false, mensagem: 'Erro no servidor: ' + e.message };
    }
}

/**
Exclusão apaga conteúdo visualmente para usuário mas continua na tabela.
 */
function excluirAnotacaoChamado(historicoId) {
    try {
        const ss = SpreadsheetApp.getActiveSpreadsheet();
        const abaHistorico = ss.getSheetByName(ticketHistoricoTableName);
        if (!abaHistorico) {
            return { sucesso: false, mensagem: "Aba 'tbl_chamado_historico' não encontrada na planilha." };
        }

        const idBuscado = Number(historicoId);
        if(!idBuscado) {
            return {sucesso: false, mensagem: 'ID do chamado inválido.'};
        }
        const dados = ReadTicketHistorico();

        for (let i = 0; i < dados.length; i++) {
            if (Number(dados[i][0]) === idBuscado) {
                const texto = String(dados[i][2] || '');
                if (texto.indexOf(HISTORICO_CHAMADO_PREFIXO_SISTEMA) === 0) {
                    return { sucesso: false, mensagem: 'Não é possível excluir um registro do sistema.' };
                }

                const linhaReal = i + firstLineTicketHistorico;
                const dataAtual = Utilities.formatDate(new Date(), "GMT-3", "dd/MM/yyyy");
                const textoExcluido = HISTORICO_CHAMADO_PREFIXO_EXCLUIDA + texto;

                abaHistorico.getRange(linhaReal, ticketHistoricoDataAlteracaoCol).setValue(dataAtual);
                abaHistorico.getRange(linhaReal, 1, 1, numColumnsTicketHistorico).setBackground("#F4CCCC");
                abaHistorico.getRange(linhaReal, ticketHistoricoTextoCol).setValue(textoExcluido);

                return { sucesso: true, mensagem: 'Anotação excluída da interface, dado permanece no banco de dados.' };
            }
        }
        return { sucesso: false, mensagem: 'Anotação não encontrada.' };
    } catch (e) {
        return { sucesso: false, mensagem: 'Erro no servidor: ' + e.message };
    }
}

function excluirAnexoChamado(anexoId) {
    try {
        const ss = SpreadsheetApp.getActiveSpreadsheet();
        const abaAnexos = ss.getSheetByName(ticketAnexosTableName);
        if (!abaAnexos) {
            return {sucesso: false,  mensagem: "Aba 'tbl_chamado_anexos' não encontrada na planilha."}
        }

        const idBuscado = Number(anexoId);
        if (!idBuscado) {
            return {sucesso: false, mensagem: 'ID do anexo inválido'};
        }
        const dados = ReadTicketAnexos();

        for (let i = 0; i < dados.length; i++) {
            if (Number(dados[i][0]) === idBuscado) {
                const linhaReal = i + firstLineTicketAnexos;
                const dataAtual = Utilities.formatDate(new Date(), "GMT-3", "dd/MM/yyyy");

                abaAnexos.getRange(linhaReal, ticketAnexosDataExclusaoCol).setValue(dataAtual);
                abaAnexos.getRange(linhaReal, 1, 1, numColumnsTicketAnexos).setBackground("#F4CCCC");

                const chamadoIdDoAnexo = dados[i][1];
                const nomeArquivo = dados[i][3];
                adicionarHistoricoSistema(chamadoIdDoAnexo, 'Anexo excluído: "' + nomeArquivo + '" (' + tipo + ')');

                return {sucesso: true, mensagem: 'Anexo exlcuído da interface, dado permanece no banco de dados.'}
            }
        }
        return{sucesso: false, mensagem: 'Anexo não encontrado.'}
    } catch (e) {
        return { sucesso: false, mensagem: 'Erro no servidor: ' + e.message };
    }
}