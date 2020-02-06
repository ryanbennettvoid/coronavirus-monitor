
const PORT = process.env.port || 9999

const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')

const routes = require('./routes')
const { init: initDataFetcher } = require('./data-fetcher')

const main = async () => {
  try {
    initDataFetcher()

    const app = express()
    app.use(cors())

    routes.forEach(({ method, endpoint, handlers }) => {
      app[method](endpoint, ...handlers)
      console.log(`applied route: ${method} ${endpoint}`)
    })

    app.listen(PORT, () => {
      console.log(`listening on port: ${PORT}`)
    })

  } catch (err) {
    return Promise.reject(err)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})