
const SHEET_ID = '1wQVypefm946ch4XDp37uZ-wartW4V7ILdg-qYiDXUHM'
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=xlsx`

const fs = require('fs')
const fetch = require('node-fetch')
const tempfile = require('tempfile')
const XLSX = require('xlsx')
const csvParse = require('csv-parse/lib/sync')
const moment = require('moment')

const parseLastUpdate = (lastUpdate, sheetName) => {
  const normalizedSheetName = sheetName.substr(0, 5)
  try {
    if (lastUpdate.length === '2/4/20 3:03'.length) {
      return moment(lastUpdate, 'MM/DD/YY HH:mm').toISOString()
    } else if (lastUpdate.length === '2/4/2020 3:03'.length) {
      return moment(lastUpdate, 'MM/DD/YYYY HH:mm').toISOString()
    } else if (lastUpdate.length === '2/4/2020 3:03:00'.length) {
      return moment(lastUpdate, 'MM/DD/YYYY HH:mm:ss').toISOString()
    }
    const fallbackDate = moment(normalizedSheetName, 'MMMDD')
    fallbackDate.set('year', 2020)
    return fallbackDate.toISOString()
  } catch (err) {
    console.error(err, { lastUpdate, normalizedSheetName })
    return null
  }
}

const fetchData = async () => {
  try {

    const res = await fetch(SHEET_URL)
    const buffer = await res.buffer()

    const filepath = tempfile('.xlsx')
    fs.writeFileSync(filepath, buffer)

    const workbook = XLSX.readFile(filepath)
    const { SheetNames: sheetNames, Sheets: sheets } = workbook

    const data = sheetNames.reduce((outerAcc, sheetName) => {
      const sheetAsCsv = XLSX.utils.sheet_to_csv(sheets[sheetName])
      const sheetAsJson = csvParse(sheetAsCsv)
      const sheetData = sheetAsJson.reduce((acc, line, idx) => {
        if (idx === 0) {
          return acc
        }
        const [ province, country, lastUpdate, confirmed, deaths, recovered ] = line
        if (!(province || country)) {
          return acc
        }
        const parsedDate = parseLastUpdate(lastUpdate, sheetName)
        return acc.concat({
          province,
          country,
          lastUpdate: parsedDate,
          confirmed,
          deaths,
          recovered
        })
      }, [])
      return outerAcc.concat(sheetData)
    }, [])

    fs.writeFileSync(`./dump.json`, JSON.stringify(data, null, 2))

  } catch (err) {
    return Promise.reject(err)
  }
}

const getData = async () => {
  try {
    // TODO: read file async
    const data = JSON.parse(fs.readFileSync(`./dump.json`, 'utf8'))
    return data
  } catch (err) {
    return Promise.reject(err)
  }
}

const init = () => {
  const loop = () => {
    fetchData().catch(console.error)
    setTimeout(loop, 60 * 60 * 1000)
  }
  loop()
}

module.exports = {
  init,
  getData
}