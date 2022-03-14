const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const fs = require('fs')

const PORT = 5000 || process.env.PORT
const app = express()

app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.post('/start', (req, res) => {
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

  fs.writeFile('._env', userValues, (err) => {
    if (err) {
      console.log(err)
    } else {
      console.log('File created successfully.')
      console.log(fs.readFileSync("._env", "utf8"))
    }
  })
  res.send("Credentials saved.")
})

app.listen(PORT, () => {
  console.log(`Server is listening on port: ${PORT}`)
})
