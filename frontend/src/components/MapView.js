import React, { useState, useEffect } from 'react'
import ReactDOMServer from "react-dom/server"
import API from '../api'
import Loading from './Loading'
import './MapView.css'
import moment from 'moment'
import { Map as LeafletMap, Marker, Popup, TileLayer } from 'react-leaflet'
import L from 'leaflet'
import Slider, { Range } from 'rc-slider'
import 'rc-slider/assets/index.css'
import { RegionsFilter } from './LineGraphView'

import {
  SHOW_CONFIRMED,
  SHOW_DEATHS,
  SHOW_RECOVERED
} from '../constants'

import {
  hideUsCitiesFilter
} from '../util.js'

const customIconCache = {}

function createCustomMarker(r, count) {
  const { region } = r
  const key = `${r}-${count}`
  if (customIconCache[key]) {
    return customIconCache[key]
  }
  const shortCount = count >= 1000 ? `${(count / 1000).toFixed(1)}k` : count

  const colorClass = count >= 30000 ? 'large' :
                     count >= 1000 ? 'medium' :
                     count >= 50 ? 'small' :
                     'xs'

  const size = count >= 30000 ? 80 :
                     count >= 1000 ? 50 :
                     30

  const customIcon = new L.DivIcon({
      iconAnchor: null,
      popupAnchor: [0, 0],
      shadowUrl: null,
      shadowSize: null,
      shadowAnchor: null,
      iconSize: new L.Point(size, size),
      className: `custom-marker-icon ${colorClass}`,
      html: ReactDOMServer.renderToString(
        <div className='custom-marker-label'>{shortCount}</div>
      )
  })
  customIconCache[key] = customIcon
  return customIcon
}

function MapView(props) {

  const [isLoading, setIsLoading] = useState(false)
  const [history, setHistory] = useState(null)
  const [mode, setMode] = useState(SHOW_CONFIRMED)
  const [sliderValue, setSliderValue] = useState(0)

  useEffect(() => {

    setIsLoading(true)
    API.getHistory()
      .then((data) => {
        const filteredData = Object
          .values(data)
          .filter(hideUsCitiesFilter)
          .reduce((acc, r) => {
            return {
              ...acc,
              [r.region]: r
            }
          }, {})

        setHistory(filteredData)
        
        const defaultSliderValue = Object.values(data)[0].confirmed.length - 1
        setSliderValue(defaultSliderValue)
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

  const regions = Object
    .values(history)

  const dates = regions[0].confirmed
    .map(({ date }) => moment(date))
  const dateRangeEnd = dates[sliderValue]

  const rangedRegions = regions.map((region) => {
    const updatedRegion = {
      ...region,
      confirmed: region.confirmed.filter(({ date }) => moment(date).isSameOrBefore(dateRangeEnd)),
      deaths: region.deaths.filter(({ date }) => moment(date).isSameOrBefore(dateRangeEnd)),
      recovered: region.recovered.filter(({ date }) => moment(date).isSameOrBefore(dateRangeEnd))
    }
    return {
      ...updatedRegion,
      latestConfirmed: updatedRegion.confirmed[updatedRegion.confirmed.length - 1].count,
      latestDeaths: updatedRegion.deaths[updatedRegion.deaths.length - 1].count,
      latestRecovered: updatedRegion.recovered[updatedRegion.recovered.length - 1].count
    }
  })
  .filter(({ latestConfirmed, latestDeaths, latestRecovered }) => {
    const count = mode === SHOW_CONFIRMED ? latestConfirmed :
                  mode === SHOW_DEATHS ? latestDeaths :
                  latestRecovered
    return count > 0
  })

  const sliderMarks = dates.reduce((acc, date, idx) => {
    if (idx % 3 === 0) {
      return {
        ...acc,
        [idx]: moment(date).format('MMM DD')
      }
    }
    return acc
  }, {})

  const center = [30, 0]

  return (
    <div>
      <RegionsFilter
        setMode={setMode}
        mode={mode}
      />
      <div className='date-slider-container'>
        <Slider
          min={0}
          max={dates.length - 1}
          value={sliderValue}
          onChange={(v) => setSliderValue(v)}
          marks={sliderMarks}
        />
      </div>
      <LeafletMap center={center} zoom={2}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; <a href=&quot;http://osm.org/copyright&quot;>OpenStreetMap</a> contributors"
        />
        {
          rangedRegions.map((r) => {
            const { lat, lng, region, latestConfirmed, latestDeaths, latestRecovered } = r
            const count = mode === SHOW_CONFIRMED ? latestConfirmed :
                          mode === SHOW_DEATHS ? latestDeaths :
                          latestRecovered
            return (
              <Marker position={{ lat, lng }} icon={createCustomMarker(r, count)} zIndexOffset={count}>
                <Popup>{ region }</Popup>
              </Marker>
            )
          })
        }
      </LeafletMap>
    </div>
  )

}

export default MapView