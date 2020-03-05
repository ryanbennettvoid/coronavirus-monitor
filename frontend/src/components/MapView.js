import React, { useState, useEffect } from 'react'
import API from '../api'
import Loading from './Loading'
import './MapView.css'

function MapView(props) {

  const [isLoading, setIsLoading] = useState(false)
  const [history, setHistory] = useState(null)

  useEffect(() => {

    setIsLoading(true)
    API.getHistory()
      .then((data) => {
        setHistory(data)
      })
      .finally(() => {
        setIsLoading(false)
      })

  }, [])

  if (isLoading) {
    return <Loading/>
  }

  if (!history) {
    return null
  }

  return <div>map</div>
}

export default MapView