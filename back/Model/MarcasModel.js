let brandTableName = 'tbl_marca'
let firstLineBrands  = 3
let numColumnsBrands = 5

let brandIdCol = 0
let brandNameCol = 1
let brandDtCadastroCol = 2
let brandDtExclusaoCol = 3
let brandDtAlteracaoCol = 4

function ReadBrands() {

  const objRows = ReadSheet(brandTableName, firstLineBrands, numColumnsBrands)

  objRows.forEach( item => {
    item[brandDtCadastroCol] = isEmpty( item[brandDtCadastroCol] ) ? "" :  dateToString(item[brandDtCadastroCol])
    item[brandDtExclusaoCol] = isEmpty( item[brandDtExclusaoCol] ) ? "" :  dateToString(item[brandDtExclusaoCol])
    item[brandDtAlteracaoCol] = isEmpty( item[brandDtAlteracaoCol] ) ? "" : dateToString(item[brandDtAlteracaoCol])
  })
  
  return objRows
}

function  findBrandId(id) {
  
  return FindContext(brandTableName, id, firstLineBrands, numColumnsBrands)
}

function findBrand(columnName, context) {

  switch (columnName) {
    case 'id':
      return FindContext(brandTableName, context, firstLineBrands, brandIdCol)
    case 'name':
    case 'nome':
      return FindContext(brandTableName, context, firstLineBrands, brandNameCol)
      
    default:
      return false
  }

  return SearchContext(brandTableName, context, firstLineBrands, numColumnsBrands)
}
