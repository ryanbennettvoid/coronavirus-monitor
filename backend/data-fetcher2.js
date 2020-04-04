
const fetch = require('node-fetch')
const csvParse = require('csv-parse/lib/sync')
const moment = require('moment')

const URL_CONFIRMED = 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_global.csv'
const URL_DEATHS = 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_deaths_global.csv'
const URL_RECOVERED = 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_recovered_global.csv'

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
//     "latestDeaths": 1234,
//     "latestRecovered": 1234,
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

const normalizeCsv = async (csv, which, includeGeo) => {
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

        const whichLatestCount = whichValues.slice(-1)[0].count

        const countsMergeObj = (
          which === 'confirmed' ? { latestConfirmed: whichLatestCount } :
          which === 'deaths' ? { latestDeaths: whichLatestCount } :
          which === 'recovered' ? { latestRecovered: whichLatestCount } :
          {}
        )

        const geoMergeObj = includeGeo ? { lat, lng } : {}

        return Object.assign({}, {
          province,
          country,
          region,
          isChina: country.toLowerCase().includes('china'),
          isAmerica: country.toLowerCase() === 'us',
          [which]: whichValues
        }, countsMergeObj, geoMergeObj)
        return obj
      })
  } catch (err) {
    return Promise.reject(err)
  }
}

const filterCsvFetchMap = {
  'confirmed': fetchConfirmed,
  'deaths': fetchDeaths,
  'recovered': fetchRecovered
}

const combineNormalized = (acc, row) => {
  const { region } = row
  return {
    ...acc,
    [region]: {
      ...acc[region],
      ...row
    }
  }
}

const toSortOrder = (regions, filter) => {
  return Object.values(regions)
    .sort((a, b) => {
      switch (filter) {
        case 'confirmed':
          return b.latestConfirmed - a.latestConfirmed
        case 'deaths':
          return b.latestDeaths - a.latestDeaths
        case 'recovered':
          return b.latestRecovered - a.latestRecovered
      }
    })
    .reduce((acc, k, idx) => {
      return {
        ...acc,
        [k.region]: idx
      }
    }, {})
}

const getHistory = async (filter) => {
  try {

    if (filter) {
      if (!['confirmed', 'deaths', 'recovered'].includes(filter)) {
        throw new Error(`invalid filter: ${filter}`)
      }
      const csv = await filterCsvFetchMap[filter]()
      const normalized = await normalizeCsv(csv, filter)
      const regions = normalized
        .reduce(combineNormalized, {})
      const sortOrder = toSortOrder(regions, filter)
      return { regions, sortOrder }
    }

    const [csvConfirmed, csvDeaths, csvRecovered] = await Promise.all([fetchConfirmed(), fetchDeaths(), fetchRecovered()])

    const normalizedConfirmed = await normalizeCsv(csvConfirmed, 'confirmed')
    const normalizedDeaths = await normalizeCsv(csvDeaths, 'deaths')
    const normalizedRecovered = await normalizeCsv(csvRecovered, 'recovered')

    const regions = [
      ...normalizedConfirmed, 
      ...normalizedDeaths, 
      ...normalizedRecovered
    ]
    .reduce(combineNormalized, {})

    const sortOrder = toSortOrder(regions)
    return { regions, sortOrder }
  } catch (err) {
    return Promise.reject(err)
  }
}

module.exports = {
  getHistory
}
