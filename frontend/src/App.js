import React from 'react'
import './App.css'
import TabSwitcher from './components/TabSwitcher'
import LineGraphView from './components/LineGraphView'

const SOURCE_URL = 'https://github.com/CSSEGISandData/COVID-19'
const PROJECT_URL = 'https://github.com/ryanbennettvoid/coronavirus-monitor'

function App() {

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
        <div className='link-wrapper'>
          Data source: <a target='_blank' href={SOURCE_URL}>{SOURCE_URL}</a>
        </div>
        <div className='link-wrapper'>
          Code: <a target='_blank' href={PROJECT_URL}>{PROJECT_URL}</a>
        </div>
      </div>
    </div>
  )
}

export default App
