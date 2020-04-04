
import API from './api'

export const loadData = (filter) => {
  return API.getHistory(filter)
    .then((data) => {
      if (!data) {
        throw new Error(`no data provided`)
      }
      return data
    })
    .catch((err) => {
      console.error(err)
    })
}