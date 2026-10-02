let employeeTableName = 'tbl_funcionarios'
let firstLineEmployees = 3
let numColumnsEmployees = 2

let employeeIdCol = 1
let employeeNomeCol = 2

function ReadEmployees() {
    const objRows = ReadSheet(employeeTableName, firstLineEmployees, numColumnsEmployees)

    return objRows.map(linha =>
        linha.map(valor => (valor instanceof Date) ? dateToString(valor) : valor)
    )
}
