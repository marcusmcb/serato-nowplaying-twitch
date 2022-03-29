const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const fs = require('fs')
const { spawn } = require('child_process')
const http = require('http')
const socketIO = require('socket.io')

const PORT = 5000 || process.env.PORT
const app = express()
const server = http.createServer(app)

const io = socketIO(server, {
  cors: {
    cors: {
      origin: 'http://localhost:3000'
    }
  }
})

app.io = io

// global var to carry child/spawn process pid value
let child

// global var for socket emitter
let mainSocket

// socket.io connection
app.io.on('connection', (socket) => {
  mainSocket = socket
  socket.emit('startup', `Socket ID ${socket.id} connected to Express.`)
  socket.on('message', (message) => {
    console.log("-------------------------------------")
    console.log(`Message from ${socket.id}: ${message}`)
  })
  socket.on('disconnect', () => {
    console.log(`Express socket ID ${socket.id} is disconnected.`)
  })  
})

// express middleware
app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// api endpoint to save user creds as .env file
app.post('/saveCreds', async (req, res) => {
  let userValues =
    'TWITCH_OAUTH_TOKEN=' +
    `"${req.body.TWITCH_OAUTH_TOKEN}"` +
    '\n' +
    'TWITCH_CHANNEL_NAME=' +
    `"${req.body.TWITCH_CHANNEL_NAME}"` +
    '\n' +
    'TWITCH_BOT_USERNAME=' +
    `"${req.body.TWITCH_BOT_USERNAME}"` +
    '\n' +
    'SERATO_DISPLAY_NAME=' +
    `"${req.body.SERATO_DISPLAY_NAME}"` +
    '\n'
  let userPrefs = {
    oauth_token: req.body.TWITCH_OAUTH_TOKEN,
    twitch_channel_name: req.body.TWITCH_CHANNEL_NAME,
    twitch_bot_name: req.body.TWITCH_BOT_USERNAME,
    serato_display_name: req.body.SERATO_DISPLAY_NAME
  }
  let userPrefsFile = JSON.stringify(userPrefs)
  // add try/catch block to snag any writefile errors
  await fs.writeFile('.env', userValues, (err) => {
    if (err) {
      console.log(err)
    } else {
      console.log('File created successfully.')
      console.log(fs.readFileSync('.env', 'utf8'))
    }
  })
  await fs.writeFile('preferences.json', userPrefsFile, 'utf8', (err) => {
    if (err) {
      console.log(err)
    } else {
      console.log('File created successfully.')
      console.log(fs.readFileSync('preferences.json', 'utf8'))
    }
  })
  res.send('Credentials saved.')
})

// api endpoint to start serato bot script
app.get('/startBot', async (req, res) => {
  // try {} catch (err) {}
  let pid = await spawn(`node`, [__dirname + '\\index.js'])  
  pid.on('error', (err) => {    
    console.log(err)
  })
  pid.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`)
  })
  // error listener for Serato typos in user creds (WORKING)
  pid.stderr.on('data', (data) => {      
    console.log(`stderr: ${data}`)
    mainSocket.emit('foo', data.toString())        
  })  
  res.send({ pid: pid.pid })
})

// api endpoint to kill serato bot script
app.get('/endBot/:pid', (req, res) => {
  let pid = req.params.pid
  console.log('PID: ', pid)
  let killPid = spawn('taskkill', ['/PID', pid, '/F'])
  // add error checking from taskkill here
  killPid.on('error', (err) => {
    console.log(err)
  })
  killPid.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`)
  })
  res.send('Done')
})

// main app port listener
server.listen(PORT, () => {
  console.log(`Server is listening on port: ${PORT}`)
})
