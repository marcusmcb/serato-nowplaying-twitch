import { useState } from 'react'
import axios from 'axios'
import { Button, Form, FormGroup, Input, Label } from 'reactstrap'
import './App.css'

const App = () => {
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
    <div className='App font-face-gm'>
      <div className='app-title'>
        <p>!npChatBot</p>
      </div>
      <div className='row'>
        <div className='column-left'>
          <Form className='form' onSubmit={saveUserCreds}>
            <FormGroup>
              {/* <Label for='exampleEmail'>Username</Label> */}
              <Input
                type='text'
                name='TWITCH_OAUTH_TOKEN'
                value={userCreds.TWITCH_OAUTH_TOKEN}
                onChange={handleChange}
                placeholder='your Twitch OAuth key'
                size='sm'
                className='w-50'
              />
            </FormGroup>
            <FormGroup>
              {/* <Label for='examplePassword'>Password</Label> */}
              <Input
                type='text'
                name='TWITCH_CHANNEL_NAME'
                value={userCreds.TWITCH_CHANNEL_NAME}
                onChange={handleChange}
                placeholder='your Twitch channel name'
                size='sm'
                className='w-50'
              />
            </FormGroup>
            <FormGroup>
              {/* <Label for='examplePassword'>Password</Label> */}
              <Input
                type='text'
                name='TWITCH_BOT_USERNAME'
                value={userCreds.TWITCH_BOT_USERNAME}
                onChange={handleChange}
                placeholder='your Twitch chatbot name'
                size='sm'
                className='w-50'
              />
            </FormGroup>
            <FormGroup>
              {/* <Label for='examplePassword'>Password</Label> */}
              <Input
                type='text'
                name='SERATO_DISPLAY_NAME'
                value={userCreds.SERATO_DISPLAY_NAME}
                onChange={handleChange}
                placeholder='your Serato display name'
                size='sm'
                className='w-50'
              />
            </FormGroup>
            <button className='ui-button' type='submit'>
              Submit
            </button>
          </Form>

          <div className='server-response'>Enter your credentials above.</div>
        </div>
        <div className='column-right'>
          <div className='script-button-row'>
            <form onSubmit={startBot}>
              <button className='ui-button' type='submit'>
                Start
              </button>
            </form>
            <form onSubmit={endBot}>
              <button className='ui-button' type='submit'>
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
