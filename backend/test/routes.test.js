
const routes = require('../routes')

const getRoute = (method, endpoint) => {
  return routes.find((route) => {
    return route.method === method && 
           route.endpoint === endpoint
  })
}

describe('routes', () => {

  it('should fetch history route by filter', async () => {

    const route = getRoute('get', '/history')
    expect(route).toBeTruthy()
    const handler = route.handlers[0]
    expect(handler).toBeTruthy()

    const filters = ['confirmed', 'deaths', 'recovered']
    for (const filter of filters) {

      const mockReq = {
        query: { filter }
      }

      let data = null

      const mockRes = {
        json: jest.fn((d) => {
          data = d
        })
      }

      await handler(mockReq, mockRes)
      expect(mockRes.json.mock.calls.length).toBe(1)
      expect(data).toBeTruthy()
      expect(data.regions).toBeTruthy()
      expect(data.sortOrder).toBeTruthy()
      expect(Object.keys(data.regions).length)
        .toBe(Object.keys(data.sortOrder).length)
      for (const k of Object.keys(data.sortOrder)) {
        expect(typeof k).toBe('string')
        expect(typeof data.sortOrder[k]).toBe('number')
      }

      const region = Object.values(data.regions)[0]
      expect(region).not.toHaveProperty('lat')
      expect(region).not.toHaveProperty('lng')

      switch (filter) {
        case 'confirmed':
          expect(Array.isArray(region.confirmed)).toBe(true)
          expect(typeof region.latestConfirmed).toBe('number')
          for (const k of ['deaths', 'latestDeaths', 'recovered', 'latestRecovered']) {
            expect(region).not.toHaveProperty(k)
          }
          break
        case 'deaths':
          expect(Array.isArray(region.deaths)).toBe(true)
          expect(typeof region.latestDeaths).toBe('number')
          for (const k of ['confirmed', 'latestConfirmed', 'recovered', 'latestRecovered']) {
            expect(region).not.toHaveProperty(k)
          }
          break
        case 'recovered':
          expect(Array.isArray(region.recovered)).toBe(true)
          expect(typeof region.latestRecovered).toBe('number')
          for (const k of ['deaths', 'latestDeaths', 'confirmed', 'latestConfirmed']) {
            expect(region).not.toHaveProperty(k)
          }
          break
      }

    }

  }, 30000)

  it('should fetch history route by filter with geo', async () => {

    const route = getRoute('get', '/history')
    const handler = route.handlers[0]
    const filter = 'confirmed'
    const geo = true

    const mockReq = {
      query: { filter, geo }
    }

    let data = null

    const mockRes = {
      json: jest.fn((d) => {
        data = d
      })
    }

    await handler(mockReq, mockRes)
    expect(mockRes.json.mock.calls.length).toBe(1)
    expect(data).toBeTruthy()

    const region = Object.values(data.regions)[0]
    expect(region).toHaveProperty('lat')
    expect(region).toHaveProperty('lng')

  }, 30000)

})