import React, { useState } from 'react'
import './TabSwitcher.css'

function TabSwitcher(props) {

  const { tabs } = props

  const [currentTabIndex, setCurrentTabIndex] = useState(0)

  return (
    <div className="tabswitcher">
      <div className='header'>
        {
          tabs.map(({ label }, idx) => {
            return <div className='label' key={`tab-${label}-${idx}`} onClick={setCurrentTabIndex.bind(this, idx)}>{label}</div>
          })
        }
      </div>
      <div className='body'>
        { tabs[currentTabIndex].component }
      </div>
    </div>
  )
}

export default TabSwitcher
