function ReadEquipments() {
    return new EquipmentsModel().read().map(e => [
        e.id, e.nome, e.marca, e.capacidade, e.modelo, e.patrimonio, e.sequencia, e.localizacao, e.active, e.estado || ''
    ]);
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
    let contratoBuscado = (criterios && criterios.contratoId) ? Number(criterios.contratoId) : 0;
    let origemBuscada = (criterios && criterios.origem) ? String(criterios.origem).trim().toLowerCase() : "";
    let somenteAtrasados = !!(criterios && criterios.atrasados);
    const agora = new Date();
    const numeroContrato = {};
    ReadContracts().forEach(c => { numeroContrato[Number(c[contractIdCol])] = String(c[contractNumberCol] || ''); });

    let idsComAnexo = new Set(
        ReadTicketAnexos()
            .filter(linha => !linha[7])
            .map(linha => Number(linha[1]))
    );

    const textoEquip = e => e[5] + ' - ' + e[1] + (e[4] ? '/' + e[4] : '');
    const equipPorId = {};
    equipamentos.forEach(e => { equipPorId[Number(e[0])] = e; });

    // Preventiva tem vários equipamentos (lista do chamado + checklist da OS):
    // a tabela mostra "Diversos", mas o filtro por equipamento procura em todos.
    let equipsPorChamado = null;
    if (equipamentoBuscado !== "") {
        equipsPorChamado = {};
        const incluir = (chamadoId, idEquip) => {
            chamadoId = Number(chamadoId); idEquip = Number(idEquip);
            if (!chamadoId || !idEquip) return;
            (equipsPorChamado[chamadoId] = equipsPorChamado[chamadoId] || new Set()).add(idEquip);
        };
        ReadTicketEquipamentos().forEach(l => {
            if (!l[ticketEquipDataExclusaoCol - 1]) incluir(l[ticketEquipChamadoIdCol - 1], l[ticketEquipEquipamentoIdCol - 1]);
        });
        ReadTicketChecklist().forEach(l => {
            if (!l[ticketChecklistDataExclusaoCol - 1]) incluir(l[ticketChecklistChamadoIdCol - 1], l[ticketChecklistEquipamentoIdCol - 1]);
        });
    }

    for (let i = 0; i < dados.length; i++) {
        let colTipo = String(dados[i][3] || '').trim().toLowerCase();
        let preventiva = (colTipo === 'preventiva');

        // ID_EQUIPAMENTO (dados[i][1]) é só o ID -- traduz pra "Patrimônio - Nome/Modelo"
        // pra mostrar na tabela e pra poder filtrar pelo patrimônio digitado de verdade.
        let equip = equipPorId[Number(dados[i][1])];
        let equipamentoTexto = preventiva ? 'Diversos' : (equip ? textoEquip(equip) : '');
        let localizacaoTexto = preventiva ? 'Diversos' : (equip ? equip[7] : '');

        let colEquipamento = equipamentoTexto.toLowerCase();
        if (preventiva && equipsPorChamado) {
            const ids = new Set(equipsPorChamado[Number(dados[i][0])] || []);
            if (Number(dados[i][1])) ids.add(Number(dados[i][1]));
            colEquipamento += ' ' + Array.from(ids)
                .map(id => equipPorId[id] ? textoEquip(equipPorId[id]) : '')
                .join(' ').toLowerCase();
        }
        let colMotivo = String(dados[i][2] || '').trim().toLowerCase();
        let colPrioridade = String(dados[i][4] || '').trim().toLowerCase();
        let colStatus = String(dados[i][11] || '').trim().toLowerCase();
        let desativado = (colStatus === 'cancelado' || colStatus === 'concluido');
        let concluido = (colStatus === 'concluido');

        let cEquipamento = (equipamentoBuscado === "" || colEquipamento.includes(equipamentoBuscado));
        let cMotivo = (motivoBuscado === "" || colMotivo.includes(motivoBuscado));
        let cTipo = (tipoBuscado === "" || colTipo.includes(tipoBuscado));
        let cPrioridade = (prioridadeBuscada === "" || colPrioridade.includes(prioridadeBuscada));
        let cStatus = (statusBuscado === "" || colStatus.includes(statusBuscado));
        let colContrato = Number(dados[i][ticketsContratoIdCol - 1]) || 0;
        // chamados antigos não têm ORIGEM: contam como manuais
        let colOrigem = String(dados[i][ticketsOrigemCol - 1] || '').trim().toLowerCase() || 'manual';
        let cContrato = (!contratoBuscado || colContrato === contratoBuscado);
        let cOrigem = (origemBuscada === "" || colOrigem === origemBuscada);
        let atraso = avaliarAtrasoChamado(dados[i], agora);
        let cAtraso = (!somenteAtrasados || atraso.atrasado);

        if(cEquipamento && cMotivo && cTipo && cPrioridade && cStatus && cContrato && cOrigem && cAtraso) {
            res.push({
                id: dados[i][0],
                equipamento: equipamentoTexto,
                localizacao: localizacaoTexto,
                motivo: dados[i][2],
                tipo: dados[i][3],
                prioridade: dados[i][4],
                abertoPor: dados[i][6],
                atribuidoA: dados[i][7],
                dataAbertura: dados[i][5],
                status: dados[i][11],
                desativado: desativado,
                concluido: concluido,
                temAnexo: idsComAnexo.has(Number(dados[i][0])),
                contrato: colContrato ? (numeroContrato[colContrato] || ('#' + colContrato)) : '',
                origem: colOrigem,
                atrasado: atraso.atrasado,
                motivoAtraso: atraso.motivos.join(', ')
            })
        }
    }

    res.sort((a, b) => {
        const porDesativado = (a.desativado ? 1 : 0) - (b.desativado ? 1 : 0);
        if (porDesativado !== 0) return porDesativado;
        return Number(b.id) - Number(a.id);
    });
    return res;
}

function buscarChamadoDetalhado(idInput) {
    try {
        const idBuscado = Number(idInput);
        const dados = ReadTickets();
        const linha = dados.find(l => Number(l[0]) === idBuscado);
        if (!linha) {
            return { sucesso: false, mensagem: 'Chamado não encontrado (ID ' + idBuscado + ').' };
        }

        // Todos os equipamentos do chamado (tbl_chamado_equipamentos; sem
        // lista, o da coluna B), separados por "; ".
        const equipamentoTexto = listarEquipamentosChamado_(linha[0], linha[1])
            .map(e => e.patrimonio
                ? ('Patrimônio ' + e.patrimonio + ' - ' + e.nome + (e.modelo ? '/' + e.modelo : '') + (e.localizacao ? ' (' + e.localizacao + ')' : ''))
                : e.nome)
            .join('; ');

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
            dataAlteracao: linha[12],
            contrato: '',
            contratoNumero: '',
            contratoEmpresa: '',
            contratoEmail: '',
            origem: linha[ticketsOrigemCol - 1] || '',
            competencia: linha[ticketsCompetenciaCol - 1] || '',
            dataPrevista: linha[ticketsDataPrevistaCol - 1] || '',
            prazoAtendimento: linha[ticketsPrazoAtendimentoCol - 1] || '',
            prazoSolucao: linha[ticketsPrazoSolucaoCol - 1] || ''
        };
        if (linha[ticketsContratoIdCol - 1]) {
            const c = ReadContracts().find(l => Number(l[contractIdCol]) === Number(linha[ticketsContratoIdCol - 1]));
            if (c) {
                chamado.contrato = c[contractNumberCol] + ' — ' + c[contractEmpresaCol];
                chamado.contratoNumero = String(c[contractNumberCol] || '');
                chamado.contratoEmpresa = String(c[contractEmpresaCol] || '');
                chamado.contratoEmail = String(c[contractEmailCol] || '');
                if (!chamado.contratoEmail && linha[ticketsFornecedorIdCol - 1]) {
                    const f = ReadSuppliers().find(l => Number(l[supplierIdCol - 1]) === Number(linha[ticketsFornecedorIdCol - 1]));
                    if (f) chamado.contratoEmail = String(f[supplierEmailCol - 1] || '');
                }
            } else {
                chamado.contrato = 'ID ' + linha[ticketsContratoIdCol - 1];
            }
        }

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
                abaChamados.getRange(linhaReal, ticketsDtExclusaoCol).setValue(dataAtual);
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
 * Muda o status do chamado (Aberto / Em Andamento / Concluído -- botões
 * Atender/Resolver do modal de detalhes). Preenche DATA_INICIO_ANDAMENTO ou
 * DATA_FINALIZACAO quando faz sentido, e registra a troca no histórico.
 * Pra "Concluido" exige um motivo de encerramento, registrado no histórico.
 */
// observacoesEquip (opcional, no encerramento): [{ equipamentoId, observacao }]
// -- observação por patrimônio, usada nas preventivas.
function alterarStatusChamado(idInput, novoStatus, motivo, observacoesEquip) {
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

        const motivoLimpo = String(motivo || '').trim();
        if (novoStatus === 'Concluido' && !motivoLimpo) {
            return { sucesso: false, mensagem: "Informe o motivo do encerramento." };
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

                // Observações por equipamento (encerramento) antes de mudar o
                // status: se a gravação falhar, o chamado não fica concluído.
                const textoObsEquip = novoStatus === 'Concluido'
                    ? executarComLock(function () { return salvarObservacoesEncerramentoChamado_(idBuscado, observacoesEquip); })
                    : '';

                abaChamados.getRange(linhaReal, ticketsStatusCol).setValue(novoStatus);
                abaChamados.getRange(linhaReal, ticketsDtAlteracaoCol).setValue(dataAtual);

                if (novoStatus === 'Em Andamento') {
                    abaChamados.getRange(linhaReal, ticketsDtInicioAndamentoCol).setValue(dataAtual);
                }
                if (novoStatus === 'Concluido') {
                    abaChamados.getRange(linhaReal, ticketsDtFinalizacaoCol).setValue(dataAtual);
                    // OS com itens de checklist pendentes: o motivo informado
                    // é a justificativa das pendências.
                    const pendentes = contarPendentesChecklistChamado(idBuscado);
                    adicionarHistoricoSistema(idBuscado, pendentes
                        ? 'Chamado encerrado com ' + pendentes + ' item(ns) de checklist pendente(s). Motivo: ' + motivoLimpo
                        : 'Chamado encerrado. Motivo: ' + motivoLimpo);
                    if (textoObsEquip) adicionarHistoricoSistema(idBuscado, 'Observações por equipamento no encerramento:\n' + textoObsEquip);
                } else {
                    adicionarHistoricoSistema(idBuscado, 'Status alterado para "' + novoStatus + '".');
                }
                return { sucesso: true, mensagem: 'Status atualizado para "' + novoStatus + '".' };
            }
        }
        return { sucesso: false, mensagem: "Chamado não encontrado (ID " + idBuscado + ")." };
    } catch (e) {
        return { sucesso: false, mensagem: "Erro no servidor: " + e.message };
    }
}

function reativarChamado(idInput, motivo) {
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
                const motivoLimpo = String(motivo || '').trim();
                abaChamados.getRange(linhaReal, ticketsStatusCol).setValue("Aberto");
                abaChamados.getRange(linhaReal, ticketsDtExclusaoCol).setValue('');
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
    return buscarAnexosGenerico(ticketAnexosTableName, chamadoId, firstLineTicketAnexos, numColumnsTicketAnexos);
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
    const resultado = excluirAnexoGenerico(ticketAnexosTableName, anexoId, firstLineTicketAnexos, numColumnsTicketAnexos);

    if (resultado.sucesso) {
        adicionarHistoricoSistema(resultado.idRegistro, 'Anexo excluído: "' + resultado.nomeArquivo + '" (' + resultado.tipo + ')');
    }

    return resultado;
}