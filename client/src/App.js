import { useState } from 'react'
import axios from 'axios'
import infoIcon from '../src/images/info_icon.png'
import './App.css'

const App = (props) => {
  // var to store pid from spawned node process
  let id

  const [userCreds, setUserCreds] = useState({
    TWITCH_OAUTH_TOKEN: '',
    TWITCH_CHANNEL_NAME: '',
    TWITCH_BOT_USERNAME: '',
    SERATO_DISPLAY_NAME: '',
  })

  const styles = {
    input: {
      height: 50,
    },
  }

  const handleChange = (e) => {
    setUserCreds({
      ...userCreds,
      [e.target.name]: e.target.value,
    })
  }

  const saveUserCreds = async (e) => {
    e.preventDefault()
    await axios
      .post('http://localhost:5000/saveCreds', userCreds)
      .then((response) => {
        console.log(response)
        let dataReturn = document.querySelector('.server-response')
        dataReturn.innerHTML = response.data
      })
      .catch((err) => console.log(err))
  }

  const startBot = async (e) => {
    e.preventDefault()
    await axios.get('http://localhost:5000/startBot').then((response) => {
      let { pid } = response.data
      id = pid
      let dataReturn = document.querySelector('.server-response')
      dataReturn.innerHTML = 'Bot script started'
    })
  }

  const endBot = async (e) => {
    e.preventDefault()
    await axios.get(`http://localhost:5000/endBot/${id}`).then((response) => {
      console.log(response)
      let dataReturn = document.querySelector('.server-response')
      dataReturn.innerHTML = 'Bot script ended'
    })
  }

  return (
    <div className='App'>
      <div className='app-title'>
        <p>!npChatBot</p>
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
            <img className='info-icon' src={infoIcon}></img>
          </form>
          <form>
            <label>
              <input
                type='text'
                value={userCreds.TWITCH_CHANNEL_NAME}
                name='TWITCH_CHANNEL_NAME'
                onChange={handleChange}
                placeholder='your Twitch channel name'
              />
            </label>
            <img className='info-icon' src={infoIcon}></img>
          </form>
          <form>
            <label>
              <input
                type='text'
                name='TWITCH_BOT_USERNAME'
                value={userCreds.TWITCH_BOT_USERNAME}
                onChange={handleChange}
                placeholder='your chatbot name'
              />
            </label>
            <img className='info-icon' src={infoIcon}></img>
          </form>
          <form>
            <label>
              <input
                type='text'
                name='SERATO_DISPLAY_NAME'
                value={userCreds.SERATO_DISPLAY_NAME}
                onChange={handleChange}
                placeholder='your Serato Profile Name'
              />
            </label>
            <img className='info-icon' src={infoIcon}></img>
          </form>
          <form onSubmit={saveUserCreds}>
            <button className='foo-button' type='submit'>
              Submit
            </button>
          </form>
          <div className='server-response'></div>
        </div>
        <div className='column data-return'>
          <div className='script-button-row'>
            <form onSubmit={startBot}>
              <button className='foo-button' type='submit'>
                Start
              </button>
            </form>
            <form onSubmit={endBot}>
              <button className='foo-button' type='submit'>
                Kill
              </button>
            </form>
          </div>
        </div>
      </div>
      <div className='app-footer'>{/* <p>MCB Engineering, 2022</p> */}</div>
    </div>
  )
}

export default App

// tons of UI updates now that we have all of our I/O sorted
