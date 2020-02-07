
// https://docs.google.com/spreadsheets/d/1wQVypefm946ch4XDp37uZ-wartW4V7ILdg-qYiDXUHM/htmlview?usp=sharing&sle=true#

const SHEET_ID = '1wQVypefm946ch4XDp37uZ-wartW4V7ILdg-qYiDXUHM'
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=xlsx`

const fs = require('fs')
const fetch = require('node-fetch')
const tempfile = require('tempfile')
const XLSX = require('xlsx')
const csvParse = require('csv-parse/lib/sync')
const moment = require('moment')

const metadata = {}

const dateFormats = [
  {
    template: 'X/X/XX XX:XX',
    format:   'M/D/YY HH:mm'
  },
  {
    template: 'X/X/XX X:XX',
    format:   'M/D/YY H:mm'
  },
  {
    template: 'X/XX/XX X:XX',
    format:   'M/DD/YY H:mm'
  },
  {
    template: 'X/XX/XX XX:XX',
    format:   'M/DD/YY HH:mm'
  },
  {
    template: 'X/X/XXXX XX:XX',
    format:   'M/D/YYYY MM:mm'
  },
  {
    template: 'X/X/XXXX X:XX',
    format:   'M/D/YYYY H:mm'
  },
  {
    template: 'X/XX/XXXX XX:XX',
    format:   'M/DD/YYYY HH:mm'
  },
  {
    template: 'X/XX/XXXX X:XX',
    format:   'M/DD/YYYY H:mm'
  },
  {
    template: 'X/X/XXXX XX:XX:XX',
    format:   'M/D/YYYY HH:mm:ss'
  },
  {
    template: 'X/X/XXXX X:XX:XX',
    format:   'M/D/YYYY H:mm:ss'
  },
  {
    template: 'X/XX/XXXX XX:XX:XX',
    format:   'M/DD/YYYY HH:mm:ss'
  },
  {
    template: 'X/XX/XXXX X:XX:XX',
    format:   'M/DD/YYYY H:mm:ss'
  },
  {
    template: 'X/XX/XXXX XX:XX AM',
    format:   'M/DD/YYYY hh:mm A'
  },
  {
    template: 'X/XX/XXXX XX:XX PM',
    format:   'M/DD/YYYY hh:mm A'
  },
  {
    template: 'X/XX/XXXX X:XX PM',
    format:   'M/DD/YYYY h:mm A'
  },
  {
    template: 'X/XX/XX XX:XX PM',
    format:   'M/DD/YY hh:mm A'
  },
  {
    template: 'X/XX/XXXX',
    format:   'M/DD/YYYY'
  },
]

const parseLastUpdate = (lastUpdate) => {
  const lastUpdateTemplate = `${lastUpdate}`.replace(/[0-9]/g, "X")
  try {
    const match = dateFormats.find(({ template }) => template === lastUpdateTemplate )
    if (match) {
      const { format } = match
      return moment(lastUpdate, format).toISOString()
    }
    return null
  } catch (err) {
    console.error(err, { lastUpdate })
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
        const parsedDate = parseLastUpdate(lastUpdate)
        if (!parsedDate) {
          return acc
        }
        if (moment(parsedDate).isAfter(moment())) {
          return acc
        }
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
    metadata.dumpLastUpdated = moment().toISOString()
    console.log(`updated dump at ${moment().format('DD/MM/YY HH:mm:ss')}`)

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
  getData,
  metadata
}