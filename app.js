const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const fs = require('fs')
const childProcess = require('child_process')
const ps = require('ps-node')
const PORT = 5000 || process.env.PORT
const app = express()

let processId
let newProcess

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
  const runScript = (scriptPath, callback) => {
    // keep track of whether callback has been invoked to prevent multiple invocations
    var invoked = false
    process = childProcess.fork(scriptPath)
    newProcess = process
    processId = process.pid
    console.log("* * * * * * * * * * * * *")
    console.log(process.pid)            
    // listen for errors as they may prevent the exit event from firing
    process.on('error', function (err) {
      if (invoked) return
      invoked = true
      callback(err)
    })

    process.on('SIGINT', () => {
      console.log("* * * * * * * * * * * * * * * * *")
      console.log('Receiving SIGINT signal in Node.')
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
  runScript('./index.js', (err) => {
    if (err) {
      console.log(err)
    } else {      
      res.send('Chat bot connected.')
    }
  })
})

app.post('/endScript', (newProcess, req, res) => {
  // ps.lookup(
  //   {      
  //     arguments: './index.js',
  //   },
  //   function (err, resultList) {
  //     if (err) {
  //       throw new Error(err)
  //     }

  //     resultList.forEach(function (process) {
  //       if (process) {
  //         console.log(
  //           'PID: %s, COMMAND: %s, ARGUMENTS: %s',
  //           process.pid,
  //           process.command,
  //           process.arguments
  //         )
  //       }
  //     })
  //   }
  // )
  // console.log(processId)
  ps.kill(newProcess.pid, (err) => {
    if (err) {
      throw new Error(err)
    } else {
      console.log('Process %s has been killed')
    }
  })  
})

app.listen(PORT, () => {
  console.log(`Server is listening on port: ${PORT}`)
})