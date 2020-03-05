
const moment = require('moment')
const { getHistory, getGeo } = require('./data-fetcher2')

module.exports = [
  {
    method: 'get',
    endpoint: '/history',
    handlers: [
      async (req, res) => {
        try {
          const data = await getHistory()
          res.json(data)
        } catch (err) {
          console.error(err)
          res.status(500).json({ error: err.message })
        }
      }
    ]
  }
]