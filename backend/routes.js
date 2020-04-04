
const { getHistory } = require('./data-fetcher2')

module.exports = [
  {
    method: 'get',
    endpoint: '/history',
    handlers: [
      async (req, res) => {
        try {
          const { filter, geo } = req.query
          const data = await getHistory(filter, geo)
          res.json(data)
        } catch (err) {
          console.error(err)
          res.status(500).json({ error: err.message })
        }
      }
    ]
  }
]