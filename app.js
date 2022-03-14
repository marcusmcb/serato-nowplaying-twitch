const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const fs = require('fs')
const childProcess = require('child_process')

const PORT = 5000 || process.env.PORT
const app = express()

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

  await fs.writeFile('._env', userValues, (err) => {
    if (err) {
      console.log(err)
    } else {
      console.log('File created successfully.')
      console.log(fs.readFileSync('._env', 'utf8'))
    }
  })
  res.send('Credentials saved.')
})

app.post('/launch', async (req, res) => {
  function runScript(scriptPath, callback) {
    // keep track of whether callback has been invoked to prevent multiple invocations
    var invoked = false

    var process = childProcess.fork(scriptPath)

    // listen for errors as they may prevent the exit event from firing
    process.on('error', function (err) {
      if (invoked) return
      invoked = true
      callback(err)
    })

    // execute the callback once the process has finished running
    process.on('exit', function (code) {
      if (invoked) return
      invoked = true
      var err = code === 0 ? null : new Error('exit code ' + code)
      callback(err)
    })
  }

  // Now we can run a script and invoke a callback when complete, e.g.
  runScript('./index.js', function (err) {
    if (err) throw err
    console.log('finished running some-script.js')
  })
})

app.listen(PORT, () => {
  console.log(`Server is listening on port: ${PORT}`)
})
