import React, { useState, useEffect } from 'react'
import ReactDOMServer from "react-dom/server"
import API from '../api'
import Loading from './Loading'
import './MapView.css'
import { Map as LeafletMap, Marker, Popup, TileLayer } from 'react-leaflet'
import L from 'leaflet'

const customIconCache = {}

function createCustomMarker(r) {
  const { region, latestConfirmed } = r
  const key = region
  if (customIconCache[key]) {
    return customIconCache[key]
  }
  const shortLatestConfirmed = latestConfirmed >= 1000 ? `${(latestConfirmed / 1000).toFixed(1)}k` :
    latestConfirmed

  const colorClass = latestConfirmed >= 30000 ? 'large' :
                     latestConfirmed >= 1000 ? 'medium' :
                     latestConfirmed >= 50 ? 'small' :
                     'xs'

  const size = latestConfirmed >= 30000 ? 80 :
                     latestConfirmed >= 1000 ? 50 :
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
        <div className='custom-marker-label'>{shortLatestConfirmed}</div>
      )
  })
  customIconCache[key] = customIcon
  return customIcon
}

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

  const regions = Object.values(history)

  const center = [30, 0]

  return (
    <LeafletMap center={center} zoom={2}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; <a href=&quot;http://osm.org/copyright&quot;>OpenStreetMap</a> contributors"
      />
      {
        regions.map((r) => {
          const { lat, lng, region, latestConfirmed } = r
          return (
            <Marker position={{ lat, lng }} icon={createCustomMarker(r)} zIndexOffset={latestConfirmed}>
              <Popup>{ region }</Popup>
            </Marker>
          )
        })
      }
    </LeafletMap>
  )

}

export default MapView