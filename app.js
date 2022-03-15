const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const fs = require('fs')
const childProcess = require('child_process')
const ps = require('ps-node')
const kill = require('tree-kill')
var exec = require('child_process').exec

const PORT = 5000 || process.env.PORT
const app = express()

let child

app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.post('/start', async (req, res) => {
  console.log('REQ: ', req.body)
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

  await fs.writeFile('.env', userValues, (err) => {
    if (err) {
      console.log(err)
    } else {
      console.log('File created successfully.')
      console.log(fs.readFileSync('.env', 'utf8'))
    }
  })
  res.send('Credentials saved.')
})

app.post('/launch', async (req, res) => {
  child = exec('node index.js', (err, stdout, stderr) => {
    if (stdout) console.log('stdout: ' + stdout)
    if (stderr) console.log('stderr: ' + stderr)
    if (err !== null) {
      console.log('exec error: ' + err)
    }
  })
  console.log("CHILD PID: ", child.pid)  
  processId = child.pid
  console.log("PROCESS ID: ", processId)
  child.stdout.on('data', function (log_data) {
    console.log(log_data)
  })
})

app.post('/endScript', async (newProcess, req, res) => {
  console.log(child.pid)
  kill(child.pid)
})

app.listen(PORT, () => {
  console.log(`Server is listening on port: ${PORT}`)
})
