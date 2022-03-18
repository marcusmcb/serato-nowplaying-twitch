import { useState } from 'react'
import axios from 'axios'
import './App.css'

const App = () => {

  let id

  const [userCreds, setUserCreds] = useState({
    TWITCH_OAUTH_TOKEN: '',
    TWITCH_CHANNEL_NAME: '',
    TWITCH_BOT_USERNAME: '',
    SERATO_DISPLAY_NAME: '',
  })

  const handleChange = (e) => {
    setUserCreds({
      ...userCreds,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    await axios
      .post('http://localhost:5000/start', userCreds)
      .then((response) => {
        console.log(response)
        let dataReturn = document.querySelector('.server-response')
        dataReturn.innerHTML = response.data
      })
      .catch((err) => console.log(err))
  }

  const handleStart = async (e) => {
    e.preventDefault()    
    await axios.get('http://localhost:5000/launch')
    .then((response) => {      
      let { pid } = response.data
      id = pid
      console.log(pid)
      // pid = response.data.pid            
      
    })
  }

  const endScript = async (e) => {
    e.preventDefault()
    await axios.get(`http://localhost:5000/endScript/${id}`)
    .then((response) => {
      console.log(response)
    })
  }

  const startScript = (e) => {
    console.log('HERE')
    // check for .env file on click
    // if none, prompt user to enter values
    // if present, start bot script
  }

  const updateCreds = (e) => {
    console.log('HERE')
    // pull values from .env file
    // place values in respective form fields for update
  }

  return (
    <div className='App'>
      <div className='app-title'>
        <p>!npBot for Serato Pro DJ & Twitch</p>
      </div>
      <div className='row'>
        <div className='column'>
          <form>
            <label>
              <input
                type='text'
                name='TWITCH_OAUTH_TOKEN'
                value={userCreds.TWITCH_OAUTH_TOKEN}
                onChange={handleChange}
                placeholder='your TMI OAuth key'
              />
            </label>
          </form>
          <form>
            <label>
              <input
                type='text'
                value={userCreds.TWITCH_CHANNEL_NAME}
                name='TWITCH_CHANNEL_NAME'
                onChange={handleChange}
                placeholder='Twitch Channel Name'
              />
            </label>
          </form>
          <form>
            <label>
              <input
                type='text'
                name='TWITCH_BOT_USERNAME'
                value={userCreds.TWITCH_BOT_USERNAME}
                onChange={handleChange}
                placeholder='Chat Bot Name'
              />
            </label>
          </form>
          <form>
            <label>
              <input
                type='text'
                name='SERATO_DISPLAY_NAME'
                value={userCreds.SERATO_DISPLAY_NAME}
                onChange={handleChange}
                placeholder='Serato Profile Name'
              />
            </label>
          </form>
          <form onSubmit={handleSubmit}>
            <button type='submit'>Submit</button>
          </form>
          <form onSubmit={handleStart}>
            <button type='submit'>Start</button>
          </form>
          <form onSubmit={endScript}>
            <button type='submit'>Kill</button>
          </form>
          <div className='server-response'>

          </div>
        </div>
        <div className='column data-return'>
          <p>Two</p>
        </div>
      </div>
      <div className='app-footer'>
        <p>MCB Engineering, 2022</p>
      </div>
    </div>
  )
}

export default App
