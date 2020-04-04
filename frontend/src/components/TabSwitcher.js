import React, { useState } from 'react'
import './TabSwitcher.css'

function TabSwitcher(props) {

  const { tabs } = props

  const [currentTabIndex, setCurrentTabIndex] = useState(0)

  return (
    <div className="tabswitcher">
      <div className='header'>
        <div className='title'>Coronavirus Cases Worldwide</div>
        {
          tabs.map(({ label }, idx) => {
            const extraClass = (currentTabIndex === idx) ? 'label-selected' : ''
            return <div className={`label ${extraClass}`} key={`tab-${label}-${idx}`} onClick={setCurrentTabIndex.bind(this, idx)}>{label}</div>
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
