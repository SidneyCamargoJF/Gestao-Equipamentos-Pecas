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