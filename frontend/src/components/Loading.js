import React, { useState } from 'react'
import useInterval from 'react-useinterval'
import './Loading.css'

export default function Loading() {
  const [count, setCount] = useState(0)

  useInterval(() => {
    if (count > 15) {
      setCount(0)
    } else {
      setCount(count + 1)
    }
  }, 100)

  const message = count < 5 ? 'Loading' : 
                  count < 10 ? 'This may take a few seconds' :
                  'Please wait'
  const dots = Array(count).fill('.')
  return <div className='loading-text'>{message}{dots}</div>
}