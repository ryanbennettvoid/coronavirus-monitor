
const BASE_URL = `http://localhost:9999`

export default class API {

  static async makeRequest(method, endpoint, headers, body) {
    try {
      const url = `${BASE_URL}${endpoint}`
      const res = await fetch(url, {
        method,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: method.toLowerCase() === 'get' ? undefined : JSON.stringify(body)
      })
      return res.json()
    } catch (err) {
      return Promise.reject(err)
    }
  }

  static getHistory() {
    return API.makeRequest('GET', `/history`, {}, {})
  }

}