
function updateDynamicTableData(table, dataArray) {

    // Clear table data
    for(var i = table.rows.length - 1; i > 0; i--) {
        table.deleteRow(i);
    }

    count=0;
    // Create table from data received
    for (const dataEntry of dataArray){
        let row = table.insertRow(-1);
        count++;
        // Add class for css styling on data rows, excluding headers
        row.setAttribute("class", "analyseTableRow");

        // row.setAttribute("class", "objectTableRow");
        let cells = [];
        for (const cellIndex in dataEntry) {
            let cell = row.insertCell(cellIndex);
            cell.setAttribute("class", "analyseTableCell");
            cell.innerHTML = dataEntry[cellIndex];
            cells.push(cell);
        }
    }
}
