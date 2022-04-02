import axios from 'axios'
import { useEffect } from 'react'
import './cratestats.css'

const CrateStats = () => {
  useEffect(() => {
    axios
      .get('http://localhost:5000/getStats')
      .then((response) => console.log('SERATO DATA: ', response.data))
  })

  return (
    <div className='cratestats'>
      <div>Crate Stats</div>
    </div>
  )
}

export default CrateStats
