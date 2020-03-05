
const fetch = require('node-fetch')
const csvParse = require('csv-parse/lib/sync')
const moment = require('moment')

const URL_CONFIRMED = 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-Confirmed.csv'
const URL_DEATHS = 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-Deaths.csv'
const URL_RECOVERED = 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-Recovered.csv'

const fetchFile = async (url) => {
  try {
    const res = await fetch(url)
    const text = await res.text()
    return text
  } catch (err) {
    return Promise.reject(err)
  }
}

const fetchConfirmed = () => fetchFile(URL_CONFIRMED)
const fetchDeaths = () => fetchFile(URL_DEATHS)
const fetchRecovered = () => fetchFile(URL_RECOVERED)

// [
//   {
//     "province": "Hubei",
//     "country": "Mainland China",
//     "region": "Hubei",
//     "isChina": true,
//     "isAmerica": false,
//     "latestConfirmed": 1234,
//     "confirmed": [
//       { "date": "xxx", "count": "yyy" },
//       ...
//     ],
//     "deaths": [
//       { "date": "xxx", "count": "yyy" },
//       ...
//     ],
//     "recovered": [
//       { "date": "xxx", "count": "yyy" },
//       ...
//     ]
//   },
//   ...
// ]

const normalizeCsv = async (csv, which) => {
  try {
    const json = csvParse(csv)
    const [ _0, _1, _2, _3, ...dates ] = json[0]

    return json
      .filter((_, idx) => idx > 0)
      .map((row) => {
        const [ province, country, lat, lng, ...values ] = row
        const region = province || country
        const whichValues = values
            .map((value, idx) => ({
              date: moment(dates[idx], 'M/D/YY HH:mm'),
              count: parseInt(value)
            }))
            .filter(({count}) => !isNaN(count))
        const mergeObj = which === 'confirmed' ? {
          latestConfirmed: whichValues.slice(-1)[0].count,
        } : {}

        return Object.assign({}, {
          province,
          country,
          region,
          isChina: country.toLowerCase().includes('china'),
          isAmerica: country.toLowerCase() === 'us',
          lat,
          lng,
          [which]: whichValues
        }, mergeObj)
        return obj
      })
  } catch (err) {
    return Promise.reject(err)
  }
}

const getHistory = async () => {
  try {
    const [csvConfirmed, csvDeaths, csvRecovered] = await Promise.all([fetchConfirmed(), fetchDeaths(), fetchRecovered()])

    const normalizedConfirmed = await normalizeCsv(csvConfirmed, 'confirmed')
    const normalizedDeaths = await normalizeCsv(csvDeaths, 'deaths')
    const normalizedRecovered = await normalizeCsv(csvRecovered, 'recovered')

    const combined = [ ...normalizedConfirmed, ...normalizedDeaths, ...normalizedRecovered ]
      .reduce((acc, row) => {
        const { region } = row
        return {
          ...acc,
          [region]: {
            ...acc[region],
            ...row
          }
        }
      }, {})

    return combined
  } catch (err) {
    return Promise.reject(err)
  }
}

module.exports = {
  getHistory
}
