import React, { useState, useEffect } from 'react'
import moment from 'moment'
import {XYPlot, XAxis, YAxis, HorizontalGridLines, VerticalGridLines, LineMarkSeries, DiscreteColorLegend} from 'react-vis';

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

  const [isLoading, setIsLoading] = useState(false)
  const [history, setHistory] = useState(null)
  const [filter, setFilter] = useState({})
  const [mode, setMode] = useState(SHOW_CONFIRMED)
  const [ftux, setFtux] = useState(true)
  const [windowWidth, setWindowWidth] = useState(window.innerWidth)

  useEffect(() => {
    setIsLoading(true)
    API.getHistory()
      .then((data) => {
        setHistory(data)
        const newFilter = Object.keys(data)
          .reduce((acc, label) => {
            return { ...acc, [label]: true }
          }, {})
        setFilter(newFilter)
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

  const allLabels = Object.keys(history)

  const filteredLabels = allLabels
    .filter((label) => {
      return filter[label]
    })

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

  const selectAll = () => {
    setFilter(
      allLabels.reduce((acc, label) => ({ ...acc, [label]: true }), {})
    )
  }

  const selectNone = () => {
    setFilter({})
  }

  const onClickSegment = (label) => {
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

  const countryKeys = Object.keys(countries)

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

  const legendItems = Object.keys(filter).filter((k) => filter[k]).slice(0, 12)

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
                      .map(({ label, selected }) => <button className={`segment ${selected ? 'selected' : ''}`} onClick={onClickSegment.bind(this, label)}>
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
      <DiscreteColorLegend className='legend' height={400} width={300} items={legendItems} />
    </div>
  )
}

export default LineGraphView
