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
            label: 'History',
            component: <LineGraphView/>
          },
          {
            label: 'Map',
            component: <div>maaap!!</div>
          },
          {
            label: 'Search',
            component: <div>seeearch!!</div>
          }
        ]}
      />
    </div>
  )
}

export default App
