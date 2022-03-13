import { useState } from 'react'
import './App.css'

const App = () => {
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

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log(userCreds)
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
          <form
            onSubmit={handleSubmit}>
            <button type='submit'>Submit</button>
          </form>
        </div>
        <div className='column'>
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
