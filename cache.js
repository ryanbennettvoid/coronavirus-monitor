
// old school pre-classes approach

const moment = require('moment')

const Cache = {}

Cache.newInstance = (expires) => {
  if (typeof expires !== 'number') {
    throw new Error(`invalid value for expires: ${expires}`)
  }

  let lastSet = null
  const raw = {}

  return {
    raw,
    set: (k, v) => {
      raw[k] = v
      lastSet = moment()
    },
    get: (k) => raw[k],
    clear: () => {
      for (const k of Object.keys(raw)) {
        delete raw[k]
      }
    },
    isExpired: () => {
      if (!lastSet) {
        return false
      }
      const diff = moment().valueOf() - lastSet.valueOf()
      return diff >= expires
    }
  }
}

module.exports = Cache