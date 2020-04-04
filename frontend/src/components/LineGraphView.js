import React, { useState, useEffect } from 'react'
import moment from 'moment'
import humanizeNumber from 'humanize-number'
import {
  XYPlot, 
  XAxis,
  YAxis,
  HorizontalGridLines,
  VerticalGridLines,
  LineMarkSeries,
  DiscreteColorLegend
} from 'react-vis'

import API from '../api'
import { countries } from 'countries-list'
import './LineGraphView.css'
import Loading from './Loading'

import {
  SHOW_CONFIRMED,
  SHOW_DEATHS,
  SHOW_RECOVERED
} from '../constants'

const countryKeys = Object.keys(countries)

export function RegionsFilter(props) {
  const { 
    showingCountFiltered, 
    showingCountTotal,
    selectNone,
    setMode,
    mode,
    ftux
  } = props

  return (
    <div className='region-filter-container'>
      <div className='region-filter-left'>
        {
          typeof showingCountFiltered !== 'undefined' && typeof showingCountTotal !== 'undefined' && (
            <div className='selected-count'>
              Showing Regions ({showingCountFiltered}/{showingCountTotal})
              <button type='button' onClick={() => selectNone()}>Clear All Selections</button>
              <button type='button' onClick={() => setMode(mode)}>Reset</button>
            </div>
          )
        }
        <div className='type-filters'>
          <label>
            Confirmed Cases
            <input type='checkbox' checked={mode === SHOW_CONFIRMED} onChange={(e) => setMode(SHOW_CONFIRMED)}/>
          </label>
          <label>
            Deaths
            <input type='checkbox' checked={mode === SHOW_DEATHS} onChange={(e) => setMode(SHOW_DEATHS)}/>
          </label>
          <label>
            Recovered
            <input type='checkbox' checked={mode === SHOW_RECOVERED} onChange={(e) => setMode(SHOW_RECOVERED)}/>
          </label>
        </div>
      </div>
      <div className='region-filter-right'>
        {
          ftux && (
            <div className='hint'>Click regions below to filter and compare</div>
          )
        }
      </div>
    </div>
  )
}

const getConfirmedForLabel = (label, history) => {
  return history.regions[label].latestConfirmed
}

const getDeathsForLabel = (label, history) => {
  return history.regions[label].latestDeaths
}

const getRecoveredForLabel = (label, history) => {
  return history.regions[label].latestRecovered
}

const getCountryCodeForLabel = (label, history) => {
  if (label.toLowerCase() === 'uk') {
    return 'gb'
  }
  if (!history.regions[label]) {
    return null
  }
  const labelCountry = history.regions[label].country.toLowerCase()
  const matchedCountry = countryKeys.find((countryCode) => {
    return  countries[countryCode].name.toLowerCase() === labelCountry ||
            countryCode.toLowerCase() === labelCountry.toLowerCase()
  })
  return matchedCountry
}

function LineGraphView() {

  // state
  const [isLoading, setIsLoading] = useState(false)
  const [history, setHistory] = useState({ regions: {}, sortOrder: {} })
  const [filter, setFilter] = useState({})
  const [mode, setMode] = useState(SHOW_CONFIRMED)
  const [ftux, setFtux] = useState(true)
  const [windowWidth, setWindowWidth] = useState(window.innerWidth)

  const labels = Object.keys(history.regions)
    .sort((a, b) => history.sortOrder[a] - history.sortOrder[b])

  const selectAll = () => {
    setFilter(
      labels.reduce((acc, label) => ({ ...acc, [label]: true }), {})
    )
  }

  const selectNone = () => setFilter({})

  const setLabelSelected = (label) => {
    if (ftux) {
      const newFilter = labels.reduce((acc, l) => {
        return {
          ...acc,
          [l]: l === label
        }
      }, {})
      setFilter(newFilter)
    } else {
      setFilter({
        ...filter,
        [label]: !filter[label]
      })
    }
    setFtux(false)
  }

  const loadData = (filter) => {
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

  const loadAndSetDataForMode = (newMode) => {
    setIsLoading(true)
    selectNone()
    loadData(newMode)
    .then((history) => {
      const topChina = Object.keys(history.sortOrder)
        .sort((a, b) => history.sortOrder[a] - history.sortOrder[b])
        .filter((k) => history.regions[k].isChina)
        .slice(0, 5)

      const topRest = Object.keys(history.sortOrder)
        .sort((a, b) => history.sortOrder[a] - history.sortOrder[b])
        .filter((k) => !history.regions[k].isChina)
        .slice(0, 5)

      const newFilter = [...topChina, ...topRest]
        .reduce((acc, region) => {
          return {
            ...acc,
            [region]: true
          }
        }, {})

      setFtux(true)
      setMode(newMode)
      setHistory(history)
      setFilter(newFilter)
    })
    .finally(() => {
      setTimeout(() => {
        setIsLoading(false)
      }, 50)
    })
  }

  // hooks

  useEffect(() => {

    loadAndSetDataForMode(mode)

    const listenerHandler = () => {
      setWindowWidth(window.innerWidth)
    }

    window.addEventListener('resize', listenerHandler)
    return () => window.removeEventListener('resize', listenerHandler)
  }, [])

  // render
  if (isLoading) {
    return <Loading/>
  }

  if (!history) {
    return null
  }

  const filteredLabels = labels
    .filter((label) => {
      return filter[label]
    })
    .sort((a, b) => history.sortOrder[a] - history.sortOrder[b])

  // [
  //   {x: 1, y: 10},
  //   {x: 2, y: 5},
  //   {x: 3, y: 15}
  // ]

  const showingCountTotal = labels.length
  const showingCountFiltered = filteredLabels.length
  let maxY = 0

  const plotData = filteredLabels
    .map((label) => {

      const region = history.regions[label]

      const entries = mode === SHOW_CONFIRMED ? region.confirmed :
                      mode === SHOW_DEATHS ?  region.deaths : 
                      mode === SHOW_RECOVERED ? region.recovered :
                      []

      const data = entries
        .map((entry) => {
          const { date, count } = entry

          if (count > maxY) {
            maxY = count
          }

          return {
            x: moment(date),
            y: count / 1
          }
        })
      return data
    })

  const { labelsChina, labelsRest } = labels
    .reduce((acc, label) => {
      const selected = filteredLabels.includes(label)
      if (history.regions[label].isChina) {
        return {
          ...acc,
          labelsChina: [...acc.labelsChina, { label, selected }]
        }
      }
      return {
        ...acc,
        labelsRest: [...acc.labelsRest, { label, selected }]
      }
    }, {
      labelsChina: [],
      labelsRest: []
    })

  const visualMaxY =  maxY <= 5 ? 20 :
                      maxY <= 10 ? 50 :
                      maxY <= 100 ? 100 :
                      maxY * 1.2

  // most to least
  const legendItems = Object.keys(filter)
    .sort((a, b) => {
      return history.sortOrder[a] - history.sortOrder[b]
    })
    .filter((k) => filter[k])
    .slice(0, 12)
    .map((label) => {
      let count = 0
      switch (mode) {
        case SHOW_CONFIRMED:
          count = getConfirmedForLabel(label, history)
          break
        case SHOW_DEATHS:
          count = getDeathsForLabel(label, history)
          break
        case SHOW_RECOVERED:
          count = getRecoveredForLabel(label, history)
          break
      }
      return `${label} (${humanizeNumber(count)})`
    })

  return (
    <div className="linegraphview">
      <RegionsFilter
        showingCountFiltered={showingCountFiltered}
        showingCountTotal={showingCountTotal}
        selectAll={selectAll}
        selectNone={selectNone}
        setMode={(newMode) => {
          loadAndSetDataForMode(newMode)
        }}
        mode={mode}
        ftux={ftux}
      />
      <div>
        <div className='segments'>
          {
            [
              {
                data: labelsChina,
                name: `China (${labelsChina.length})`
              },
              {
                data: labelsRest,
                name: `Rest of the world (${labelsRest.length})`
              }
            ].map(({ data, name }, idx) => {
              return (
                data.length > 0 && (
                  <div key={`${name}-${idx}`} className={`segments-divider segment-${idx}`}>
                    {name}: {
                      data
                      .map(({ label, selected }, idx) => <button key={`${label}-${idx}`} className={`segment ${selected ? 'selected' : ''}`} onClick={setLabelSelected.bind(this, label)}>
                        {
                          (() => {
                            const countryCode = name === 'China' ? 'cn' : getCountryCodeForLabel(label, history)
                            const src = countryCode ? `https://www.countryflags.io/${countryCode}/flat/16.png` :
                                        `https://placehold.it/16/000/fff?text=${label.charAt(0)}`
                            return <img className='segment-flag' src={src}/>
                          })()
                        }
                        <div className='segment-text'>{label}</div>
                      </button>)
                    }
                  </div>
                )
              )
            })
          }
        </div>
      </div>
      {
        showingCountFiltered > 0 && (
          <React.Fragment>
            <XYPlot
              className='chart'
              xType='time'
              width={Math.max(500, windowWidth - 30)}
              height={500}
              yDomain={[0, visualMaxY]}
            >
              <HorizontalGridLines />
              <VerticalGridLines />
              {
                plotData.map((data, idx) => <LineMarkSeries 
                  key={`data${idx}`} 
                  data={data}
                  />
                )
              }
              <XAxis 
                title='Time'
                tickFormat={(d) => moment(d).format('M/D')}
              />
              <YAxis 
                title='Confirmed Cases'
                left={15}
              />
            </XYPlot>
            <DiscreteColorLegend 
              className='legend' 
              height={400} 
              width={Math.min(500, windowWidth - 30)}
              items={legendItems}
            />
          </React.Fragment>
        )
      }
    </div>
  )
}

export default LineGraphView
