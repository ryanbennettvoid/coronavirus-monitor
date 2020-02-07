import React, { useEffect, useState } from 'react'
import moment from 'moment'
import './App.css'
import TabSwitcher from './components/TabSwitcher'
import LineGraphView from './components/LineGraphView'
import API from './api'

function App() {

  const [metadata, setMetadata] = useState(null)

  useEffect(() => {
    API.getMetadata()
      .then((m) => {
        setMetadata(m)
      })
      .catch(console.error)
  }, [])

  const dumpDate = metadata ? moment(metadata.dumpLastUpdated) : null

  return (
    <div className="App">
      <TabSwitcher
        tabs={[
          {
            label: 'Coronavirus Cases Worldwide',
            component: <LineGraphView/>
          }
        ]}
      />
      <div className='source-info'>
        {
          metadata && (
            <div className='cache-info'>
              Server cache last updated: {dumpDate.format('MMM d YYYY HH:mm:ss')} ({dumpDate.fromNow()})
            </div>
          )
        }
        <div className='link-wrapper'>
          Data source:
          <a target='_blank' href='https://docs.google.com/spreadsheets/d/1wQVypefm946ch4XDp37uZ-wartW4V7ILdg-qYiDXUHM/htmlview'>https://docs.google.com/spreadsheets/d/1wQVypefm946ch4XDp37uZ-wartW4V7ILdg-qYiDXUHM/htmlview</a>
        </div>
        <div className='link-wrapper'>
          Code:
          <a target='_blank' href='https://github.com/ryanbennettvoid/coronavirus-monitor'>https://github.com/ryanbennettvoid/coronavirus-monitor</a>
        </div>
      </div>
    </div>
  )
}

export default App
