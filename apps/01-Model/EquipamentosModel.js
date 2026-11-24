// =====================================================
// MODEL - EquipamentoModel.gs
// Camada de acesso a dados da aba "tbl_equipamentos".
// Herda de SheetModel (classe base genérica de leitura).
// =====================================================

// Valores aceitos na coluna ESTADO (T) de tbl_equipamentos.
const ESTADOS_EQUIPAMENTO = ['Novo', 'Bom', 'Ruim', 'Péssimo', 'Velho'];

class EquipmentsModel extends SheetModel {

  constructor() {
    // tableName, firstLine (1ª linha onde começam os dados), firstColumn
    super('tbl_equipamentos', 3, 1); // ajuste o firstLine conforme sua aba

    // As constantes abaixo são 0-based (A = 0): a tela de equipamentos usa
    // direto como índice do array. Avisa a classe base pra converter ao
    // olhar a planilha -- sem isso ela conferia a coluna R (data de
    // alteração) como se fosse a data de exclusão.
    this.colunasBaseZero = true


    // Ordem real da planilha hoje: Fornecedor (I) seguido pelas 4 colunas
    // complementares (J a O), e só depois Active/DtCadastro/DtAlteracao/
    // DtExclusao (P a S). Estado (T) veio depois, no fim da aba.
    this.setIdColumn(0)            // A - ID
    this.setActiveColumn(15)       // P - Active
    this.setDtCadastroColumn(16)   // Q - dt_cadastro
    this.setDtAlteracaoColumn(17)  // R - dt_alteracao
    this.setDtExclusaoColumn(18)   // S - dt_exclusao

    this.setNumColumns(20)

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
    this.colSei            = 11; // L - SEI
    this.colDataGarantia   = 12; // M - Data Garantia
    this.colValorAquisicao = 13; // N - Valor
    this.colObservacoes    = 14; // O - Observações
    this.colEstado         = 19; // T - Estado de conservação (coluna nova, no fim da aba)


  }

}