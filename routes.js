
const moment = require('moment')
const { getData } = require('./data-fetcher')

module.exports = [
  {
    method: 'get',
    endpoint: '/history',
    handlers: [
      async (req, res) => {
        try {
          const { by=null } = req.query

          if (!['province', 'country'].includes(by)) {
            throw new Error(`invalid by: ${by}`)
          }

          const data = await getData()

          const mapBy = data.reduce((acc, dataPoint) => {
            const label = dataPoint[by]
            if (label === '') {
              return acc
            }
            return {
              ...acc,
              [label]: (acc[label] || []).concat(dataPoint)
            }
          }, {})

          Object.keys(mapBy).forEach((regionName) => {
            mapBy[regionName] = mapBy[regionName]
              .sort((a, b) => {
                return moment(a.lastUpdate).isAfter(b.lastUpdate) ? 1 : -1
              })
          })

          res.json(mapBy)
        } catch (err) {
          console.error(err)
          res.status(500).json({ error: err.message })
        }
      }
    ]
  }
]