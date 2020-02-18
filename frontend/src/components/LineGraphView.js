import React, { useState, useEffect } from 'react'
import moment from 'moment'
import {XYPlot, XAxis, YAxis, HorizontalGridLines, VerticalGridLines, LineMarkSeries, DiscreteColorLegend} from 'react-vis';

import API from '../api'
import { countries } from 'countries-list'
import './LineGraphView.css'

const SHOW_CONFIRMED = 'SHOW_CONFIRMED'
const SHOW_DEATHS = 'SHOW_DEATHS'
const SHOW_RECOVERED = 'SHOW_RECOVERED'

function LineGraphView() {

  const [isLoading, setIsLoading] = useState(false)
  const [history, setHistory] = useState(null)
  const [filter, setFilter] = useState({})
  const [mode, setMode] = useState(SHOW_CONFIRMED)

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
  }, [])

  if (isLoading) {
    return <div>loading...</div>
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

  const { labelsInChina, labelsOutsideChina } = allLabels
    .reduce((acc, label) => {
      if (history[label].isChina) {
        return {
          ...acc,
          labelsInChina: [...acc.labelsInChina, { label, selected: filteredLabels.includes(label) }]
        }
      }
      return {
        ...acc,
        labelsOutsideChina: [...acc.labelsOutsideChina, { label, selected: filteredLabels.includes(label) }]
      }
    }, {
      labelsInChina: [],
      labelsOutsideChina: []
    })

  const visualMaxY =  maxY <= 5 ? 20 :
                      maxY <= 10 ? 50 :
                      maxY <= 100 ? 100 :
                      maxY * 1.2

  const onClickSegment = (label) => {
    setFilter({
      ...filter,
      [label]: !filter[label]
    })
  }

  const countryKeys = Object.keys(countries)

  const getCountryCodeForLabel = (label) => {
    if (label.toLowerCase() === 'uk') {
      return 'gb'
    }
    const labelCountry = history[label].country.toLowerCase()
    const matchedCountry = countryKeys.find((countryCode) => {
      return  countries[countryCode].name.toLowerCase() === labelCountry ||
              countryCode.toLowerCase() === labelCountry.toLowerCase()
    })
    return matchedCountry
  }

  const selectAll = () => {
    setFilter(
      allLabels.reduce((acc, label) => ({ ...acc, [label]: true }), {})
    )
  }

  const selectNone = () => {
    setFilter({})
  }

  const legendItems = Object.keys(filter).filter((k) => filter[k]).slice(0, 12)

  return (
    <div className="linegraphview">
      <div>
        Showing Regions ({showingCountFiltered}/{showingCountTotal})
        <button type='button' onClick={() => selectAll()}>Select All</button>
        <button type='button' onClick={() => selectNone()}>Clear Selection</button>
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
      <div>
        <div className='segments'>
          {
            labelsInChina.length > 0 && (
              <div className='segments-divider'>
                China: {
                  labelsInChina.map(({ label, selected }) => <button className={`segment ${selected ? 'selected' : ''}`} onClick={onClickSegment.bind(this, label)}>
                    <img src="https://www.countryflags.io/cn/flat/16.png"/>
                    {label}
                  </button>)
                }
              </div>
            )
          }
          {
            labelsOutsideChina.length > 0 && (
              <div className='segments-divider'>
                Outside China: {
                  labelsOutsideChina.map(({ label, selected }) => <button className={`segment ${selected ? 'selected' : ''}`} onClick={onClickSegment.bind(this, label)}>
                    {
                      (() => {
                        const countryCode = getCountryCodeForLabel(label)
                        const src = countryCode ? `https://www.countryflags.io/${countryCode}/flat/16.png` :
                                    `https://placehold.it/16/000/fff?text=${label.charAt(0)}`
                        return <img src={src}/>
                      })()
                    }
                    {label}
                  </button>)
                }
              </div>
            )
          }
        </div>
      </div>
      <XYPlot
        className='chart'
        xType='time'
        width={1200}
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
