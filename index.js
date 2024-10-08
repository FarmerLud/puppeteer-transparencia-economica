import puppeteer from "puppeteer"
import { genExcel } from "./genExcel.mjs"

const openBrowser = async () => {
    const browser = await puppeteer.launch({
        headless: false
    })
    const page = await browser.newPage()
    await page.goto("https://apps5.mineco.gob.pe/transparencia/Navegador/default.aspx?y=2024&ap=Proyecto")
    let frame = page.frames().find(f => f.name() === 'frame0')

    // pintar el concepto
    await printConcept(frame)

    // Seleccionar fila TOTAL
    await clickOnRowWhitText(frame,"TOTAL")

    // Seleccionar Categoría presupuestal
    await clickOnButton(frame,'Categoría Presupuestal')

    // esperar la carga
    await delay(5000,true)

    // pintar el concepto
    await printConcept(frame)

    // Seleccionar fila 0042:
    await clickOnRowWhitText(frame,"0042:")

    // Seleccionar Producto/Proyecto
    await clickOnButton(frame,'Producto/Proyecto')

    // esperar la carga
    await waitFor400Row(frame)

    // pintar el concepto
    await printConcept(frame)

    // obtener la cantidad de páginas
    const numPages = await getNumPages(frame)

    const allData = []

    // recorrer las páginas
    for(let i = 1; i <= numPages; i++){
        // obtener la data
        await getData(frame,allData,i)

        // ir a la siguiente página
        if(i < numPages) {
            await nextPage(frame,'Siguiente')
        }
    }

    // generar Excel
    await genExcel(allData)

    // cerrar el navegador
    await browser.close()

    console.log("Proceso terminado 😎")
}

async function printConcept(frame){
    const td = await frame.$("td[id='ctl00_CPH1_Mt0_td1']")
    const concept = await td.evaluate(node => node.innerText)
    console.log({concepto: concept})   
}

async function clickOnRowWhitText(frame,text){
    const table = await frame.$("table[class='Data']")
    const allTr = await table.$$("tr")
    let foundTr = null
    for(const tr of allTr){
        const secondTd = (await tr.$$("td"))[1]
        const tdText = await secondTd.evaluate(node => node.innerText)
        if(tdText.includes(text)){
            foundTr = tr
            break
        }
    }
    if(!foundTr) throw new Error(`No se encontró la fila con el texto ${text}`)
    await foundTr.click()
}

async function clickOnButton(frame,value){
    const button = await frame.$(`input[value='${value}']`)
    if(!button) throw new Error(`No se encontró el botón con el valor ${value}`)
    await button.click()
}

async function getNumPages(frame){
    const spanNumperPages = await frame.$('span[id="ctl00_CPH1_Pager1_LblPageCount"]')
    const numPagesStr = await spanNumperPages.evaluate(node => node.innerText) // '10'
    const numPages = Number(numPagesStr)
    console.log({numPages})
    return numPages
}

async function nextPage(frame){
    const nextBtn = await frame.$('input[id="ctl00_CPH1_Pager1_BtnNext"]')
    if(!nextBtn) throw new Error("No se encontró el botón de siguiente")
    await nextBtn.click()
    await waitForNextPage(frame)
}

async function getData(frame,allData,pageNumber){
    const table = await frame.$("table[class='Data']")
    const allTr = await table.$$("tr")

    let rowNumber = 1

    for(const tr of allTr){
        const allTd = await tr.$$("td")
        
        // no considerar el tr intermedio
        if(allTd.length === 1) continue

        const proyectName = await allTd[1].evaluate(node => node.innerText)
        const pia = await allTd[2].evaluate(node => node.innerText)
        const pim = await allTd[3].evaluate(node => node.innerText)
        const accrued = await allTd[7].evaluate(node => node.innerText)
        const progress = await allTd[9].evaluate(node => node.innerText)

        const row = { 
            proyectName, 
            pia:Number(pia.replace(/,/g,'')), 
            pim:Number(pim.replace(/,/g,'')),
            accrued:Number(accrued.replace(/,/g,'')),
            progress:Number(progress.replace(/,/g,''))
        }

        // mostrar avance cada 25 filas
        if(rowNumber%25 === 0) console.log(`página: ${pageNumber}, fila: ${rowNumber}`)
        
        allData.push(row)
        rowNumber++
    }

    console.log(`Data lleva ${allData.length} filas`)
}

async function waitFor400Row(frame){
    console.log("Esperando carga de las 400 filas...")
    await delay(1000)
    while(true){
        const lastTr = await frame.$("table[class='Data'] tr[id='tr399']")
        if(lastTr) break
        await delay(500)
    }
}

async function waitForNextPage(frame){
    console.log("Esperando cambio de página...")
    await delay(500)
    while(true){
        const loadingDiv = await frame.$('div[id="ctl00_CPH1_UpdateProgress1"]')
        const display = await loadingDiv.evaluate(node => node.style.display)
        if(display === "none") break
        await delay(500)
    }
}

function delay(time,show) {
    if(show) console.log(`Esperando ${time/1000} seg...`)
    return new Promise(function(resolve) { 
        setTimeout(resolve, time)
    });
}

openBrowser()
