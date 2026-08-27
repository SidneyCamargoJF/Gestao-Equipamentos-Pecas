function showChamado() {
    const form = HtmlService.createTemplateFromFile("ConsultaChamado");
    const showForm = form.evaluate().setSandboxMode(HtmlService.SandboxMode.IFRAME);
    showForm.setTitle("Consulta de Chamado").setHeight(900).setWidth(1400);
    SpreadsheetApp.getUi().showModalDialog(showForm, "Consulta de Chamado");
}

function filtrarChamados(criterios) {
    let dados = ReadTickets();
    let res = [];

    
} 