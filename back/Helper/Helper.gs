function Chamar(Arquivo) {

  return HtmlService.createHtmlOutputFromFile(Arquivo).getContent();
}

function caixaMsgBox(m) {
  CaixaMsg.style.display = "block";
  TituloMsg.innerHTML = "AVISO";
  CorpoMsg.innerHTML = m;

  RodapeMsg.innerHTML = BtnFechar;
}

function isEmpty(v) {
  if (v== "" || v === null) {
    return true
  }
  return false
}