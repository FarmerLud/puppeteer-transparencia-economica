import ExcelJS from 'exceljs'

const date = new Date()
const day = date.getDate()
const month = date.getMonth() + 1
const year = date.getFullYear()
const time = date.getTime()

async function genExcel(data){
    console.log('Generando Excel')
    // seteo de workbook, worksheet y parametros base.
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Export')

    // seteo de columnas y header.
    worksheet.columns = [
        { header: 'Producto/Proyecto', key: 'proyectName', width: 50 },
        { header: `PIA_${year}`, key: 'pia', width: 15 },
        { header: `PIM_${year}`, key: 'pim', width: 15 },
        { header: `Devengado_${year}`, key: 'accrued', width: 15 },
        { header: `Avance_${year}`, key: 'progress', width: 15 }
    ];

    // configurar estilo de la primera fila
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' }} ;
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(1).height = 20;
    
    // configurar color de fondo de la cabecera
    const headersCell = ['A1','B1','C1','D1','E1'];
    headersCell.forEach(cell => {
        worksheet.getCell(cell).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: '3A6EA5' }
        }
    });

    data.forEach((item) => {
        worksheet.addRow(item);
    });

    workbook.xlsx.writeFile(`Inversiones_pp0042 - ${day}-${month}-${year} ${time}.xlsx`)
    .then(() => {
        console.log('Archivo Excel guardado con éxito.');
    })
    .catch((error) => {
        console.error('Error al guardar el archivo Excel:', error);
    });
   
}

// module.exports = {genExcel}
export { genExcel }
