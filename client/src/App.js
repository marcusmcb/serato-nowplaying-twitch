import { useState, useEffect } from 'react'
import axios from 'axios'
import { Form, FormGroup, Input } from 'reactstrap'
import Titlebar from './components/Titlebar'
import { io } from 'socket.io-client'
import './App.css'

const App = () => {
  // var to store pid from spawned node process
  let id

  useEffect(() => {
    const socket = io('ws://localhost:5000', { transports: ['websocket'] })

    socket.on('connect', () => {
      socket.emit('message', `Socket ID ${socket.id} connected to React.`)
      socket.on('startup', (message) => {
        console.log('-------------------------------------')
        console.log('STARTUP MESSAGE: ', message)
      })
    })

    socket.on('foo', (message) => {
      console.log('-------------------------------------')
      console.log('SCRIPT ERROR: ', message)
      let dataReturn = document.querySelector('.server-response')
      dataReturn.innerHTML = message
    })

    socket.on('disconnect', () => {
      console.log('Client socket disconnected.')
    })
  }, [])

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

  const saveUserCreds = async (e) => {
    e.preventDefault()
    await axios
      .post('http://localhost:5000/saveCreds', userCreds)
      .then((response) => {
        console.log(response.data)
        let dataReturn = document.querySelector('.server-response')
        dataReturn.innerHTML = response.data
      })
      .catch((err) => console.log(err))
  }

  const startBot = async (e) => {
    e.preventDefault()
    await axios.get('http://localhost:5000/startBot').then((response) => {
      if (response.data.error) {
        console.log('RESPONSE: ', response.data.error)
        let botError = response.data.error
        let dataReturn = document.querySelector('.server-response')
        dataReturn.innerHTML = botError
      } else {
        let { pid } = response.data
        id = pid
        console.log(id)
        let dataReturn = document.querySelector('.server-response')
        dataReturn.innerHTML = 'Bot script started'
      }
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

  // set separate div for real time errors as they occur (serato user incorrect, etc)
  // add ping to check for serato live page based on display name entered
  // add counters to display how many times each command is used per session
  // generate analysis reports post stream?

  return (
    <div className='App font-face-gm3'>
      <div className='app-title'>
        <Titlebar />
      </div>
      <div className='row'>
        <div className='column-left'>
          <div>
            <h5 className='font-face-gm3'>User Credentials:</h5>
          </div>
          <Form className='form' onSubmit={saveUserCreds}>
            <div className='field-row'>
              <FormGroup>
                {/* <Label for='exampleEmail'>Username</Label> */}
                <Input
                  type='text'
                  name='TWITCH_OAUTH_TOKEN'
                  value={userCreds.TWITCH_OAUTH_TOKEN}
                  onChange={handleChange}
                  placeholder='your Twitch&copy; OAuth key'
                  bsSize='sm'
                />
              </FormGroup>
              <div className='info-icon font-face-gm3'>?</div>
            </div>
            <div className='field-row'>
              <FormGroup>
                {/* <Label for='examplePassword'>Password</Label> */}
                <Input
                  type='text'
                  name='TWITCH_CHANNEL_NAME'
                  value={userCreds.TWITCH_CHANNEL_NAME}
                  onChange={handleChange}
                  placeholder='your Twitch&copy; channel name'
                  bsSize='sm'
                />
              </FormGroup>
              <div className='info-icon font-face-gm3'>?</div>
            </div>
            <div className='field-row'>
              <FormGroup>
                {/* <Label for='examplePassword'>Password</Label> */}
                <Input
                  type='text'
                  name='TWITCH_BOT_USERNAME'
                  value={userCreds.TWITCH_BOT_USERNAME}
                  onChange={handleChange}
                  placeholder='your Twitch&copy; chatbot name'
                  bsSize='sm'
                />
              </FormGroup>
              <div className='info-icon font-face-gm3'>?</div>
            </div>
            <div className='field-row'>
              <FormGroup>
                {/* <Label for='examplePassword'>Password</Label> */}
                <Input
                  type='text'
                  name='SERATO_DISPLAY_NAME'
                  value={userCreds.SERATO_DISPLAY_NAME}
                  onChange={handleChange}
                  placeholder='your Serato&copy; display name'
                  bsSize='sm'
                />
              </FormGroup>
              <div className='info-icon font-face-gm3'>?</div>
            </div>

            <button className='ui-button font-face-gm5' type='submit'>
              Save
            </button>
          </Form>

          <div className='server-response font-face-gm3'>
            Enter your credentials above.
          </div>
        </div>
        <div className='column-right'>
          <div className='script-button-row'>
            <form onSubmit={startBot}>
              <button className='ui-button font-face-gm5' type='submit'>
                Start
              </button>
            </form>
            <form onSubmit={endBot}>
              <button className='ui-button font-face-gm5' type='submit'>
                Kill
              </button>
            </form>
          </div>
        </div>
      </div>
      <div className='app-footer'>{}</div>
    </div>
  )
}

export default App