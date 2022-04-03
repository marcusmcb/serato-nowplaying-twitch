import axios from 'axios'
import { getParent } from 'domutils'
import { useEffect, useState, Fragment } from 'react'
import Plot from 'react-plotly.js'
import './cratestats.css'

const CrateStats = () => {
  const [seratoData, setSeratoData] = useState({})
  const [isBusy, setIsBusy] = useState(true)

  useEffect(() => {
    const getStats = async () => {
      let seratoStats
      await axios
        .get('http://localhost:5000/getStats')
        .then((response) => {
          seratoStats = response.data
        })
        .catch((error) => {
          console.log(error)
        })
      console.log(seratoStats)
      return seratoStats
    }
    getStats().then((data) => {
      setSeratoData(data)
      setIsBusy(false)
    })
  }, [])

  return (
    <div className='cratestats'>
      <div className='cratestats-title font-face-gm5'>
        <h3>Crate Stats</h3>
        <hr />
      </div>
      {isBusy ? (
        <p>Loading...</p>
      ) : (
        <Fragment>
          <div className='font-face-gm5'>
            <h5>Total Set Length: {seratoData.setLength}</h5>
          </div>
          <div className='font-face-gm5'>
            <h5>Total Tracks Played: {seratoData.totalTracksPlayed}</h5>
          </div>
          <hr />
          <div className='font-face-gm5'>
            <p>Shortest Track Played:</p>
            <p>
              {seratoData.shortestTrack.name} ({seratoData.shortestTrack.length}
              )
            </p>
          </div>
          <div className='font-face-gm5'>
            <p>Longest Track Played:</p>
            <p>
              {seratoData.longestTrack.name} ({seratoData.longestTrack.length})
            </p>
          </div>
          <div className='font-face-gm5'>
            <p>Average Track Length: {seratoData.avgTrackLength}</p>
          </div>
          <div>
            <Plot
              data={[
                {
                  type: 'bar',
                  x: seratoData.trackLengthArray,
                  y: seratoData.trackLengthArray,
                  marker: {
                    color: 'orange'
                  }
                },
              ]}
              layout={{
                width: 900,
                height: 400,
                title: 'Serato Stats',                
                paper_bgcolor: 'darkslategrey',
                plot_bgcolor: 'lightslategrey',
                font: {
                  color: 'white'
                },                
                xaxis: {
                  type: 'category',
                  title: {
                    text: 'tracks played'
                  }
                },
                yaxis: {
                  range: [0, Math.max(seratoData.trackLengthArray)],
                  type: 'log',
                  title: {
                    text: 'duration'
                  }
                },
              }}
            />
          </div>
        </Fragment>
      )}
    </div>
  )
}

export default CrateStats
