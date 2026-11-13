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
    this.setActiveColumn(15)       // O - Active
    this.setDtCadastroColumn(16)   // P - dt_cadastro
    this.setDtAlteracaoColumn(17)  // Q - dt_alteracao
    this.setDtExclusaoColumn(18)   // R - dt_exclusao

    this.setNumColumns(19)

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
    this.colSei            = 11; // l - SEI
    this.colDataGarantia   = 12; // M - Data Garantia 
    this.colValorAquisicao = 13; // N - Valor
    this.colObservacoes    = 14; // O -


  }

}