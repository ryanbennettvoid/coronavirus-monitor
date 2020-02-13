import React, { useState, useEffect } from 'react'
import moment from 'moment'
import {XYPlot, XAxis, YAxis, HorizontalGridLines, VerticalGridLines, LineMarkSeries} from 'react-vis';
import API from '../api'
import { countries } from 'countries-list'
import './LineGraphView.css'

const SHOW_CONFIRMED = 'SHOW_CONFIRMED'
const SHOW_DEATHS = 'SHOW_DEATHS'
const SHOW_RECOVERED = 'SHOW_RECOVERED'

function LineGraphView() {

  const [isLoading, setIsLoading] = useState(false)
  const [history, setHistory] = useState(null)
  const [filter, setFilter] = useState('')
  const [mode, setMode] = useState(SHOW_CONFIRMED)

  useEffect(() => {
    setIsLoading(true)
    API.getHistory()
      .then((data) => {
        setHistory(data)
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
      if (filter) {
        return label.toLowerCase().includes(filter.toLowerCase())
      }
      return true
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
    setFilter(label.toLowerCase())
  }

  const getCountryCodeForLabel = (label) => {
    if (label.toLowerCase() === 'uk') {
      return 'gb'
    }
    const labelCountry = history[label].country.toLowerCase()
    const matchedCountry = Object.keys(countries).find((countryCode) => countries[countryCode].name.toLowerCase() === labelCountry)
    return matchedCountry || labelCountry.toLowerCase()
  }

  return (
    <div className="linegraphview">
      <div>
        <input 
          className='location-filter' 
          type='text' 
          placeholder='filter'
          onChange={(e) => setFilter(e.target.value)}
          value={filter}
        />
        Showing Regions ({showingCountFiltered}/{showingCountTotal}):
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
                    <img src={`https://www.countryflags.io/${getCountryCodeForLabel(label)}/flat/16.png`}/>
                    {label}
                  </button>)
                }
              </div>
            )
          }
        </div>
      </div>
      <XYPlot
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
    </div>
  )
}

export default LineGraphView
