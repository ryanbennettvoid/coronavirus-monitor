
const Cache = require('../cache')
const moment = require('moment')

describe('Cache', () => {

  it('should initialize', () => {
    
    expect(Cache).toBeTruthy()

    expect(typeof Cache.newInstance).toBe('function')

    expect(() => {
      Cache.newInstance()
    }).toThrow()

    expect(() => {
      Cache.newInstance(1)
    }).not.toThrow()

    const cache = Cache.newInstance(1)

    expect(cache).toBeTruthy()

  })

  it('should set a value', () => {

    const cache = Cache.newInstance(1)
    expect(typeof cache.raw).toBe('object')
    expect(typeof cache.set).toBe('function')

    expect(Object.keys(cache.raw).length).toBe(0)

    const key = 'hi'
    const value = 1
    cache.set(key, value)

    expect(Object.keys(cache.raw).length).toBe(1)
    expect(cache.raw[key]).toBe(value)

  })

  it('should get a value', () => {

    const cache = Cache.newInstance(1)
    expect(typeof cache.raw).toBe('object')
    expect(typeof cache.get).toBe('function')

    const key = 'hey'
    const value = 2
    cache.raw[key] = value

    expect(cache.get(key)).toBe(value)

  })

  it('should clear a value', () => {

    const cache = Cache.newInstance(1)
    expect(typeof cache.clear).toBe('function')

    const key = 'wasup'
    const value = 3
    cache.raw[key] = value

    expect(Object.keys(cache.raw).length).toBe(1)
    cache.clear()
    expect(Object.keys(cache.raw).length).toBe(0)

  })

  it('should expire', (done) => {

    const cache = Cache.newInstance(300)
    expect(typeof cache.isExpired).toBe('function')

    cache.set('k', {})
    expect(cache.isExpired()).toBe(false)

    setTimeout(() => {
      expect(cache.isExpired()).toBe(true)
      done()
    }, 500)

  })

})