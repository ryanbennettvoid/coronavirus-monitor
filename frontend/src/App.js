import React from 'react'
import './App.css'
import TabSwitcher from './components/TabSwitcher'
import LineGraphView from './components/LineGraphView'
import MapView from './components/MapView'
import AboutView from './components/AboutView'

function App() {

  return (
    <div className="App">
      <TabSwitcher
        tabs={[
          {
            label: 'Graph',
            component: <LineGraphView/>
          },
          {
            label: 'Map',
            component: <MapView/>
          },
          {
            label: 'About',
            component: <AboutView/>
          }
        ]}
      />
    </div>
  )
}

export default App
