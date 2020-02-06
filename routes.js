
const moment = require('moment')
const { getData } = require('./data-fetcher')

module.exports = [
  {
    method: 'get',
    endpoint: '/history',
    handlers: [
      async (req, res) => {
        try {

          const data = await getData()

          const mapByRegion = data.reduce((acc, dataPoint) => {
            const { province, country } = dataPoint
            const label = province || country
            if (label === '') {
              return acc
            }
            return {
              ...acc,
              [label]: (acc[label] || []).concat(dataPoint)
            }
          }, {})

          Object.keys(mapByRegion).forEach((regionName) => {
            mapByRegion[regionName] = mapByRegion[regionName]
              .sort((a, b) => {
                return moment(a.lastUpdate).isAfter(b.lastUpdate) ? 1 : -1
              })
          })

          res.json(mapByRegion)
        } catch (err) {
          console.error(err)
          res.status(500).json({ error: err.message })
        }
      }
    ]
  }
]