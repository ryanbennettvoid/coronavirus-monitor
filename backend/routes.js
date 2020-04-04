
const { getHistory } = require('./data-fetcher2')

module.exports = [
  {
    method: 'get',
    endpoint: '/history',
    handlers: [
      async (req, res) => {
        try {
          const { filter } = req.query
          const data = await getHistory(filter)
          res.json(data)
        } catch (err) {
          console.error(err)
          res.status(500).json({ error: err.message })
        }
      }
    ]
  }
]