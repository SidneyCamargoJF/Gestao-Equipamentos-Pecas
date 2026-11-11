// =====================================================
// MODEL - EquipamentoModel.gs
// Camada de acesso a dados da aba "tbl_equipamentos".
// Herda de SheetModel (classe base genérica de leitura).
// =====================================================

class EquipmentsModel extends SheetModel {

  constructor() {
    // tableName, firstLine (1ª linha onde começam os dados), firstColumn
    super('tbl_equipamentos', 3, 1); // ajuste o firstLine conforme sua aba


    // Ordem real da planilha hoje: Fornecedor (I) seguido pelas 4 colunas
    // complementares (J a M), e só depois Active/DtCadastro/DtAlteracao/
    // DtExclusao (N a Q).
    this.setIdColumn(0)            // A - ID
    this.setActiveColumn(13)       // N - Active
    this.setDtCadastroColumn(14)   // O - dt_cadastro
    this.setDtAlteracaoColumn(15)  // P - dt_alteracao
    this.setDtExclusaoColumn(16)   // Q - dt_exclusao

    this.setNumColumns(17)

    this.colNome           = 1;  // B - Nome
    this.colMarca          = 2;  // C - Marca
    this.colCapacidade     = 3;  // D - Capacidade
    this.colModelo         = 4;  // E - Modelo
    this.colPatrimonio     = 5;  // F - Patrimônio
    this.colSequencia      = 6;  // G - Sequência
    this.colLocalizacao    = 7;  // H - Localização
    this.colFornecedor     = 8;  // I - Fornecedor
    this.colDataEntrada    = 9;  // J - Data de Entrada
    this.colNotaFiscal     = 10; // K - Nota Fiscal
    this.colValorAquisicao = 11; // L - Valor de Aquisição
    this.colObservacoes    = 12; // M - Observações


  }

}