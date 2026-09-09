function statusGarantia(dias) {
  if (dias < 0) { return 'vencida'}
  if (dias > 7) { return 'ativa'}
  return 'vencendo'
}

function calculaDias(parData1, parData2 ) {

  parData1.setHours(0, 0, 0, 0)
  parData2.setHours(0, 0, 0, 0)

  const diferencaMilisegundos = parData1 - parData2

  return Math.floor(diferencaMilisegundos / 86400000)
}

function stringToDate(dataString) {

  const dataFormatada = dataString.split('/').reverse().join('-')

  return new Date(dataFormatada)

}

function dateToString(data) {
    let fusoHorario = Session.getScriptTimeZone();

    return Utilities.formatDate(new Date(data), fusoHorario, "dd/MM/yyyy");
}

// Igual dateToString, mas com hora:minuto -- usado onde o horário importa
// (ex: histórico de chamado). O Sheets converte texto tipo "26/08/2026
// 14:30" pra um valor Date de verdade sozinho quando a célula recebe um
// setValue() com essa cara; se ao ler de volta a gente formatar só com
// dateToString (sem HH:mm), a hora que foi digitada existe no valor mas
// desaparece na exibição.
function dateTimeToString(data) {
    let fusoHorario = Session.getScriptTimeZone();

    return Utilities.formatDate(new Date(data), fusoHorario, "dd/MM/yyyy HH:mm");
}