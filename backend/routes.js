
const moment = require('moment')
const { getHistory, getGeo } = require('./data-fetcher2')
const Cache = require('./cache')
const cache = Cache.newInstance(1000 * 60 * 60)

const HISTORY_CACHE_KEY = 'history'

module.exports = [
  {
    method: 'get',
    endpoint: '/history',
    handlers: [
      async (req, res) => {
        try {
          if (!cache.isExpired()) {
            const data = cache.get(HISTORY_CACHE_KEY)
            if (data) {
              res.json(data)
              return
            }
          }

          const data = await getHistory()
          res.json(data)

          cache.set(HISTORY_CACHE_KEY, data)
        } catch (err) {
          console.error(err)
          res.status(500).json({ error: err.message })
        }
      }
    ]
  }
]