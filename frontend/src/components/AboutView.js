import React from 'react'
import './AboutView.css'

const SOURCE_URL = 'https://github.com/CSSEGISandData/COVID-19'
const PROJECT_URL = 'https://github.com/ryanbennettvoid/coronavirus-monitor'

function AboutView() {
  return (
    <div className='source-info'>
      <div className='link-wrapper'>
        Data source: <a target='_blank' href={SOURCE_URL}>{SOURCE_URL}</a>
      </div>
      <div className='link-wrapper'>
        Code: <a target='_blank' href={PROJECT_URL}>{PROJECT_URL}</a>
      </div>
    </div>
  )
}

export default AboutView