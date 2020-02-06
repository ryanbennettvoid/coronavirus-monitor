import React, { useState, useEffect } from 'react'
import moment from 'moment'
import {XYPlot, XAxis, YAxis, HorizontalGridLines, VerticalGridLines, LineMarkSeries} from 'react-vis';
import API from '../api'

import './LineGraphView.css'

function LineGraphView() {

  const [history, setHistory] = useState(null)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    API.getHistory()
      .then((data) => {
        setHistory(data)
      })
  }, [])

  if (!history) {
    return null
  }

  // [
  //   {x: 1, y: 10},
  //   {x: 2, y: 5},
  //   {x: 3, y: 15}
  // ]

  const filteredLabels = Object.keys(history)
    .filter((label) => {
      if (filter) {
        return label.toLowerCase().includes(filter.toLowerCase())
      }
      return true
    })

  let maxY = 0

  const plotData = filteredLabels
    .map((label) => {
      const entries = history[label]
      const data = entries
        .map((entry) => {
          const { confirmed, lastUpdate } = entry
          const sanitizedConfirm = confirmed / 1

          if (sanitizedConfirm > maxY) {
            maxY = sanitizedConfirm
          }

          return {
            x: moment(lastUpdate),
            y: sanitizedConfirm
          }
        })
      return data
    })

  const visualMaxY =  maxY <= 5 ? 20 :
                      maxY <= 10 ? 50 :
                      maxY <= 100 ? 100 :
                      maxY * 1.2

  const onClickSegment = (label) => {
    console.log('hi', label)
    setFilter(label.toLowerCase())
  }

  return (
    <div className="linegraphview">
      <div>
        Showing:
        <div className='segments'>
          {
            filteredLabels.map((label) => <button className='segment' onClick={onClickSegment.bind(this, label)}>{label}</button>)
          }
        </div>
      </div>
      <div>
        <input 
          className='filter' 
          type='text' 
          placeholder='filter'
          onChange={(e) => setFilter(e.target.value)}
          value={filter}
        />
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
          title='time'
          tickFormat={(d) => moment(d).format('MMM DD')}
        />
        <YAxis 
          title='confirmed'
          left={15}
        />
      </XYPlot>
    </div>
  )
}

export default LineGraphView
