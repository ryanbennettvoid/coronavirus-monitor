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

import { loadData } from '../util'

const customIconCache = {}

function createCustomMarker(r, count, mode) {
  const { region } = r
  const isRecovered = (mode === SHOW_RECOVERED)
  const key = `${r}-${count}-${isRecovered}`
  if (customIconCache[key]) {
    return customIconCache[key]
  }
  const shortCount = count >= 1000 ? `${(count / 1000).toFixed(1)}k` : count

  let colorClass = count >= 30000 ? 'large' :
                     count >= 1000 ? 'medium' :
                     count >= 50 ? 'small' :
                     'xs'

  if (isRecovered) {
    colorClass = `${colorClass} recovered`
  }

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
  const [history, setHistory] = useState({ regions: [], sortOrder: {} })
  const [mode, setMode] = useState(SHOW_CONFIRMED)
  const [sliderValue, setSliderValue] = useState(0)

  const loadAndSetDataForMode = (newMode) => {
    setIsLoading(true)
    return loadData(newMode)
    .then((history) => {
      setMode(newMode)
      setHistory(history)
      return history
    })
    .finally(() => {
      setTimeout(() => {
        setIsLoading(false)
      }, 50)
    })
  }

  useEffect(() => {

    loadAndSetDataForMode(mode)
    .then((data) => {
      const defaultSliderValue = Object
        .values(data.regions)[0].confirmed.length - 1
      setSliderValue(defaultSliderValue)
    })
    .catch((err) => {
      console.error(err)
    })

  }, [])

  if (isLoading) {
    return <Loading/>
  }

  if (!history) {
    return null
  }

  const regionsArr = Object
    .keys(history.sortOrder)
    .sort((a, b) => history.sortOrder[a] - history.sortOrder[b])
    .map((k) => history.regions[k])

  if (regionsArr.length === 0) {
    return null
  }

  const dates = regionsArr[0][mode]
    .map(({ date }) => moment(date))
  const dateRangeEnd = dates[sliderValue]

  const rangedRegions = regionsArr.map((region) => {
    const timelines = (
      mode === SHOW_CONFIRMED ? { confirmed: region.confirmed.filter(({ date }) => moment(date).isSameOrBefore(dateRangeEnd)) } :
      mode === SHOW_DEATHS ? { deaths: region.deaths.filter(({ date }) => moment(date).isSameOrBefore(dateRangeEnd)) } :
      mode === SHOW_RECOVERED ? { recovered: region.recovered.filter(({ date }) => moment(date).isSameOrBefore(dateRangeEnd)) } :
      {}
    )
    const latestCounts = (
      mode === SHOW_CONFIRMED ? { latestConfirmed: timelines.confirmed[timelines.confirmed.length - 1].count } :
      mode === SHOW_DEATHS ? { latestDeaths: timelines.deaths[timelines.deaths.length - 1].count } :
      mode === SHOW_RECOVERED ? { latestRecovered: timelines.recovered[timelines.recovered.length - 1].count } :
      {}
    )
    return Object.assign({}, region, timelines, latestCounts)
  })
  .filter(({ latestConfirmed, latestDeaths, latestRecovered }) => {
    const count = mode === SHOW_CONFIRMED ? latestConfirmed :
                  mode === SHOW_DEATHS ? latestDeaths :
                  mode === SHOW_RECOVERED ? latestRecovered :
                  0
    return count > 0
  })

  const sliderMarks = dates.reduce((acc, date, idx) => {
    if (idx % 4 === 0) {
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
        setMode={(newMode) => {
          loadAndSetDataForMode(newMode)
        }}
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
              <Marker position={{ lat, lng }} icon={createCustomMarker(r, count, mode)} zIndexOffset={count}>
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