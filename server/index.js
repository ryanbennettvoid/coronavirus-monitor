
// const dataUrl = `https://docs.google.com/spreadsheets/d/1wQVypefm946ch4XDp37uZ-wartW4V7ILdg-qYiDXUHM/htmlview?usp=sharing&sle=true#`

const fs = require('fs')
const fetch = require('node-fetch')
const tempfile = require('tempfile')
const XLSX = require('xlsx');

const SHEET_ID = '1wQVypefm946ch4XDp37uZ-wartW4V7ILdg-qYiDXUHM'
const sheetUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=xlsx`

const fetchData = async () => {
  try {

    const res = await fetch(sheetUrl)
    const buffer = await res.buffer()

    const filepath = tempfile('.xlsx')
    fs.writeFileSync(filepath, buffer)

    const workbook = XLSX.readFile(filepath)
    const { SheetNames, Sheets } = workbook
    for (sheetName of SheetNames) {
      const sheet = XLSX.utils.sheet_to_json(Sheets[sheetName])
      console.log(JSON.stringify(sheet, null, 2))
      fs.writeFileSync(`${sheetName}.json`, JSON.stringify(sheet, null, 2))
    }

  } catch (err) {
    return Promise.reject(err)
  }
}

const main = async () => {
  try {
  const data = await fetchData()  
  } catch (err) {
    return Promise.reject(err)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})