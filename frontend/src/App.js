import React from 'react'
import './App.css'
import TabSwitcher from './components/TabSwitcher'
import LineGraphView from './components/LineGraphView'

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
        Data source:
        <a href='https://docs.google.com/spreadsheets/d/1wQVypefm946ch4XDp37uZ-wartW4V7ILdg-qYiDXUHM/htmlview'>https://docs.google.com/spreadsheets/d/1wQVypefm946ch4XDp37uZ-wartW4V7ILdg-qYiDXUHM/htmlview</a>
      </div>
    </div>
  )
}

export default App
