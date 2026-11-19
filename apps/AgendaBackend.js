function formatarDataISOAgenda_(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

// parseDataFlex monta a data no fuso do script; stringToDate usava
// new Date('yyyy-MM-dd') (meia-noite UTC), que cai no dia anterior em
// Brasília e jogava o evento um dia antes na agenda.
function paraDataAgenda_(raw) {
  return parseDataFlex(raw);
}

function buscarEventosAgenda(ano, mes) {
  const inicio = new Date(ano, mes - 1, 1);
  const fim = new Date(ano, mes, 0, 23, 59, 59);

  const eventos = [];

  ReadTickets().forEach(l => {
    // Preventiva com DATA_PREVISTA aparece na data prevista (abaixo), não
    // na data de abertura.
    const ehPreventiva = String(l[3] || '').trim().toLowerCase() === 'preventiva';
    const status = String(l[11] || '').trim();
    const dataPrevista = paraDataAgenda_(l[ticketsDataPrevistaCol - 1]);
    if (ehPreventiva && dataPrevista) {
      if (status.toLowerCase() === 'cancelado' || dataPrevista < inicio || dataPrevista > fim) return;
      eventos.push({
        tipo: 'preventiva',
        data: formatarDataISOAgenda_(dataPrevista),
        id: l[0],
        titulo: String(l[2] || ('Preventiva #' + l[0])) + (status ? ' (' + (status === 'Concluido' ? 'Concluído' : status) + ')' : ''),
        status: status,
        prioridade: String(l[4] || '')
      });
      return;
    }

    const data = paraDataAgenda_(l[5]);
    if (!data || data < inicio || data > fim) return;
    eventos.push({
      tipo: 'chamado',
      data: formatarDataISOAgenda_(data),
      id: l[0],
      titulo: String(l[2] || ('Chamado #' + l[0])),
      status: String(l[11] || ''),
      prioridade: String(l[4] || '')
    });
  });

  ReadContracts()
    .filter(l => String(l[contractActiveCol] || '').trim().toUpperCase() === 'Y' && !l[contractDataEncerramento])
    .forEach(l => {
      const data = paraDataAgenda_(l[contractDataFinalCol]);
      if (!data || data < inicio || data > fim) return;
      eventos.push({
        tipo: 'contrato',
        data: formatarDataISOAgenda_(data),
        id: l[contractIdCol],
        titulo: String(l[contractNumberCol] || '') + ' — ' + String(l[contractNameCol] || '')
      });
    });

  // ===== Peças com garantia vencendo =====
  ReadParts()
    .filter(l => !l[partsDtExclusaoCol])
    .forEach(l => {
      const data = paraDataAgenda_(l[partsDtGarantiaCol]);
      if (!data || data < inicio || data > fim) return;
      eventos.push({
        tipo: 'peca',
        data: formatarDataISOAgenda_(data),
        id: l[partsIdCol],
        titulo: String(l[partsNameCol] || '')
      });
    });

  return eventos;
}
