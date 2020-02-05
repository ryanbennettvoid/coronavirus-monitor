
const fs = require('fs')
const fetch = require('node-fetch')
const tempfile = require('tempfile')
const XLSX = require('xlsx')
const csvParse = require('csv-parse/lib/sync')
const moment = require('moment')

const SHEET_ID = '1wQVypefm946ch4XDp37uZ-wartW4V7ILdg-qYiDXUHM'
const sheetUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=xlsx`

const parseLastUpdate = (lastUpdate, sheetName) => {
  const normalizedSheetName = sheetName.substr(0, 5)
  try {
    if (lastUpdate.length === '2/4/20 3:03'.length) {
      return moment(moment(lastUpdate).format('MM/DD/YY HH:mm')).toISOString()
    } else if (lastUpdate.length === '2/4/2020 3:03'.length) {
      return moment(moment(lastUpdate).format('MM/DD/YYYY HH:mm')).toISOString()
    } else if (lastUpdate.length === '2/4/2020 3:03:00'.length) {
      return moment(moment(lastUpdate).format('MM/DD/YYYY HH:mm:ss')).toISOString()
    }
    const fallbackDate = moment(moment(normalizedSheetName).format('MMMDD'))
    fallbackDate.set('year', 2020)
    return fallbackDate.toISOString()
  } catch (err) {
    console.error(err, { lastUpdate, normalizedSheetName })
    return null
  }
}

const fetchData = async () => {
  try {

    const res = await fetch(sheetUrl)
    const buffer = await res.buffer()

    const filepath = tempfile('.xlsx')
    fs.writeFileSync(filepath, buffer)

    const workbook = XLSX.readFile(filepath)
    const { SheetNames: sheetNames, Sheets: sheets } = workbook

    return sheetNames.reduce((outerAcc, sheetName) => {
      const sheetAsCsv = XLSX.utils.sheet_to_csv(sheets[sheetName])
      const sheetAsJson = csvParse(sheetAsCsv)
      const sheetData = sheetAsJson.reduce((acc, line, idx) => {
        if (idx === 0) {
          return acc // skip labels
        }
        const [ province, country, lastUpdate, confirmed, deaths, recovered ] = line
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

  } catch (err) {
    return Promise.reject(err)
  }
}

const main = async () => {
  try {
  const data = await fetchData()
  fs.writeFileSync(`./dump-${Date.now()}.json`, JSON.stringify(data, null, 2))
  } catch (err) {
    return Promise.reject(err)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})