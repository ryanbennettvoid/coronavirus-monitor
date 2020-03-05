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

const SHOW_CONFIRMED = 'SHOW_CONFIRMED'
const SHOW_DEATHS = 'SHOW_DEATHS'
const SHOW_RECOVERED = 'SHOW_RECOVERED'

function RegionsFilter(props) {
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
        <div className='selected-count'>
          Showing Regions ({showingCountFiltered}/{showingCountTotal})
          <button type='button' onClick={() => selectNone()}>Clear All Selections</button>
        </div>
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

function LineGraphView() {

  // state
  const [isLoading, setIsLoading] = useState(false)
  const [history, setHistory] = useState(null)
  const [filter, setFilter] = useState({})
  const [mode, setMode] = useState(SHOW_CONFIRMED)
  const [ftux, setFtux] = useState(true)
  const [demoPlayed, setDemoPlayed] = useState(false)
  const [windowWidth, setWindowWidth] = useState(window.innerWidth)

  const allLabels = Object.keys(history || {})

  // funcs
  const filteredLabels = allLabels
    .filter((label) => {
      return filter[label]
    })

  const selectAll = () => {
    setFilter(
      allLabels.reduce((acc, label) => ({ ...acc, [label]: true }), {})
    )
  }

  const selectNone = () => {
    setFilter({})
  }

  const setLabelSelected = (label) => {
    if (ftux) {
      const newFilter = allLabels.reduce((acc, l) => {
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

  const getCountryCodeForLabel = (label) => {
    switch (label.toLowerCase()) {
      case 'uk': return 'gb'
    }
    const labelCountry = history[label].country.toLowerCase()
    const matchedCountry = countryKeys.find((countryCode) => {
      return  countries[countryCode].name.toLowerCase() === labelCountry ||
              countryCode.toLowerCase() === labelCountry.toLowerCase()
    })
    return matchedCountry
  }

  const getConfirmedForLabel = (label) => {
    return history[label].latestConfirmed
  }

  const getDeathsForLabel = (label) => {
    return history[label].latestDeaths
  }

  const getRecoveredForLabel = (label) => {
    return history[label].latestRecovered
  }

  // hooks
  useEffect(() => {

    setIsLoading(true)
    API.getHistory()
      .then((data) => {
        if (!data) {
          throw new Error(`no data provided`)
        }
        setHistory(data)
      })
      .catch((err) => {
        console.error(err)
      })
      .finally(() => {
        setIsLoading(false)
      })

    const listenerHandler = () => {
      setWindowWidth(window.innerWidth)
    }

    window.addEventListener('resize', listenerHandler)
    return () => window.removeEventListener('resize', listenerHandler)
  }, [])

  useEffect(() => {

    if (!history || demoPlayed) {
      return
    }

    setDemoPlayed(true)

    const playIntroDemo = () => {
      const sortedRegions = Object.values(history)
        .sort((a, b) => b.latestConfirmed - a.latestConfirmed)

      const topChina = sortedRegions
        .filter((r) => r.isChina)
        .map((r) => r.region)
        .slice(0, 5)

      const topUs = sortedRegions
        .filter((r) => r.isAmerica)
        .map((r) => r.region)
        .slice(0, 5)

      const topRest = sortedRegions
        .filter((r) => !r.isChina && !r.isAmerica)
        .map((r) => r.region)
        .slice(0, 5)

      selectNone()

      // least to most confirmed
      const demoLabels = [...topChina, ...topUs, ...topRest]
        .sort((a, b) => history[a].latestConfirmed - history[b].latestConfirmed)

      demoLabels.reduce((acc, label, idx) => {
        const newFilter = {
          ...acc,
          [label]: true
        }
        setTimeout(() => {
          setFilter(newFilter)
        }, idx * 100)
        return newFilter
      }, filter)

    }

    setTimeout(() => {
      playIntroDemo()
    }, 100)

  }, [history, demoPlayed])

  // render
  if (isLoading) {
    return <Loading/>
  }

  if (!history) {
    return null
  }

  // [
  //   {x: 1, y: 10},
  //   {x: 2, y: 5},
  //   {x: 3, y: 15}
  // ]

  const showingCountTotal = allLabels.length
  const showingCountFiltered = filteredLabels.length
  let maxY = 0

  const plotData = filteredLabels
    .map((label) => {

      const entries = mode === SHOW_CONFIRMED ? history[label].confirmed :
                      mode === SHOW_DEATHS ?  history[label].deaths : 
                      mode === SHOW_RECOVERED ? history[label].recovered :
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

  const { labelsChina, labelsAmerica, labelsRest } = allLabels
    .reduce((acc, label) => {
      const selected = filteredLabels.includes(label)
      if (history[label].isChina) {
        return {
          ...acc,
          labelsChina: [...acc.labelsChina, { label, selected }]
        }
      } else if (history[label].isAmerica) {
        return {
          ...acc,
          labelsAmerica: [...acc.labelsAmerica, { label, selected }]
        }
      }
      return {
        ...acc,
        labelsRest: [...acc.labelsRest, { label, selected }]
      }
    }, {
      labelsChina: [],
      labelsAmerica: [],
      labelsRest: []
    })

  const visualMaxY =  maxY <= 5 ? 20 :
                      maxY <= 10 ? 50 :
                      maxY <= 100 ? 100 :
                      maxY * 1.2

  const countryKeys = Object.keys(countries)

  // most to least
  const legendItems = Object.keys(filter)
    .sort((a, b) => {
      switch (mode) {
        case SHOW_CONFIRMED:
          return getConfirmedForLabel(b) - getConfirmedForLabel(a)
        case SHOW_DEATHS:
          return getDeathsForLabel(b) - getDeathsForLabel(a)
        case SHOW_RECOVERED:
          return getRecoveredForLabel(b) - getRecoveredForLabel(a)
        default:
          return 0
      }
    })
    .filter((k) => filter[k])
    .slice(0, 12)
    .map((label) => {
      let count = 0
      switch (mode) {
        case SHOW_CONFIRMED:
          count = getConfirmedForLabel(label)
          break
        case SHOW_DEATHS:
          count = getDeathsForLabel(label)
          break
        case SHOW_RECOVERED:
          count = getRecoveredForLabel(label)
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
        setMode={setMode}
        mode={mode}
        ftux={ftux}
      />
      <div>
        <div className='segments'>
          {
            [
              {
                data: labelsChina,
                name: 'China'
              },
              {
                data: labelsAmerica,
                name: 'United States'
              },
              {
                data: labelsRest,
                name: 'Rest of the world'
              }
            ].map(({ data, name }) => {
              return (
                data.length > 0 && (
                  <div className='segments-divider'>
                    {name}: {
                      data
                      .sort((a, b) => getConfirmedForLabel(b.label) - getConfirmedForLabel(a.label))
                      .map(({ label, selected }) => <button className={`segment ${selected ? 'selected' : ''}`} onClick={setLabelSelected.bind(this, label)}>
                        {
                          (() => {
                            const countryCode = name === 'China' ? 'cn' : getCountryCodeForLabel(label)
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
                tickFormat={(d) => moment(d).format('MMM DD')}
              />
              <YAxis 
                title='Confirmed Cases'
                left={15}
              />
            </XYPlot>
            <DiscreteColorLegend 
              className='legend' 
              height={400} 
              width={Math.max(500, windowWidth - 30)}
              items={legendItems}
            />
          </React.Fragment>
        )
      }
    </div>
  )
}

export default LineGraphView
