import React, { useState, useEffect } from 'react'
import moment from 'moment'
import {XYPlot, XAxis, YAxis, HorizontalGridLines, LineSeries} from 'react-vis';
import API from '../api'

import './LineGraphView.css'

function LineGraphView() {

  const [history, setHistory] = useState(null)

  useEffect(() => {
    API.getHistory({ by: 'province' })
      .then((data) => {
        console.log(data)
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

  const plotData = Object.keys(history)
    // .filter((_, idx) => idx === 0)
    .map((label) => {
      const entries = history[label]
      const data = entries
        .map((entry) => {
          const { confirmed, lastUpdate } = entry
          return {
            x: moment(lastUpdate),
            y: confirmed
          }
        })
      return data
    })

  console.log(plotData)

  return (
    <div className="linegraphview">
      <XYPlot
        xType='time'
        width={1200}
        height={500}>
        <HorizontalGridLines />
        { plotData.map((data, idx) => <LineSeries key={`data${idx}`} data={data}/>) }
        <XAxis title='time'/>
        <YAxis title='confirmed'/>
      </XYPlot>
    </div>
  )
}

export default LineGraphView
