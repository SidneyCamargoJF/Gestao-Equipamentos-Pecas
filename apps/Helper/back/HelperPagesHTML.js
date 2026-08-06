function ShowForm(formHTML, title, height, width) {
  const form = HtmlService.createTemplateFromFile("formHTML");

  const showForm = form.evaluate().setSandboxMode(HtmlService.SandboxMode.IFRAME);

  showForm.setTitle(title).setHeight(height).setWidth(width)

  SpreadsheetApp.getUi().showModalDialog(showForm, title)
}

function showPage(codeName, title, height, width) {
  const form = HtmlService.createTemplateFromFile(codeName);

  const showForm = form.evaluate().setSandboxMode(HtmlService.SandboxMode.IFRAME);

  showForm.setTitle(title).setHeight(height).setWidth(width)

  Logger.log('Tela')

  SpreadsheetApp.getUi().showModalDialog(showForm, title)
}
