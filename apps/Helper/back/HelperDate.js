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

// Converte o que vier da planilha/tela em Date (hora local do script):
// Date, 'dd/MM/yyyy', 'dd/MM/yyyy HH:mm' ou 'yyyy-MM-dd'. null se não der.
// (stringToDate usa new Date('yyyy-MM-dd'), que é meia-noite UTC = 21h do
// dia anterior em Brasília -- por isso este parser monta a data local.)
function parseDataFlex(valor) {
  if (!valor) return null;
  if (Object.prototype.toString.call(valor) === '[object Date]') return isNaN(valor.getTime()) ? null : new Date(valor.getTime());
  const s = String(valor).trim();
  let m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?/);
  if (m) return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]), Number(m[4] || 0), Number(m[5] || 0));
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2}))?/);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4] || 0), Number(m[5] || 0));
  return null;
}

// Só a data (00:00) -- pra comparar dias sem a hora atrapalhar.
function inicioDoDia(data) {
  const d = new Date(data.getTime());
  d.setHours(0, 0, 0, 0);
  return d;
}

// Expediente usado nos prazos de SLA com "só horário útil".
// Feriados não são considerados.
const EXPEDIENTE_INICIO_HORA = 8;
const EXPEDIENTE_FIM_HORA = 18;

/**
 * inicio + horas. Com horasUteis = true conta só seg–sex, 08h–18h: se o
 * início cair fora do expediente, a contagem começa no próximo início de
 * expediente.
 */
function somarHorasPrazo(inicio, horas, horasUteis) {
  const minutos = Math.round(Number(horas) * 60);
  if (!horasUteis) return new Date(inicio.getTime() + minutos * 60000);

  const cursor = new Date(inicio.getTime());
  cursor.setSeconds(0, 0);
  let restante = minutos;

  const ajustarParaExpediente = function () {
    for (;;) {
      const dia = cursor.getDay();
      const minutoDoDia = cursor.getHours() * 60 + cursor.getMinutes();
      if (dia === 0 || dia === 6 || minutoDoDia >= EXPEDIENTE_FIM_HORA * 60) {
        cursor.setDate(cursor.getDate() + 1);
        cursor.setHours(EXPEDIENTE_INICIO_HORA, 0, 0, 0);
      } else if (minutoDoDia < EXPEDIENTE_INICIO_HORA * 60) {
        cursor.setHours(EXPEDIENTE_INICIO_HORA, 0, 0, 0);
      } else {
        return;
      }
    }
  };

  ajustarParaExpediente();
  while (restante > 0) {
    const fimExpediente = new Date(cursor.getTime());
    fimExpediente.setHours(EXPEDIENTE_FIM_HORA, 0, 0, 0);
    const disponivel = Math.round((fimExpediente.getTime() - cursor.getTime()) / 60000);
    if (restante <= disponivel) {
      cursor.setTime(cursor.getTime() + restante * 60000);
      return cursor;
    }
    restante -= disponivel;
    cursor.setTime(fimExpediente.getTime());
    ajustarParaExpediente();
  }
  return cursor;
}
