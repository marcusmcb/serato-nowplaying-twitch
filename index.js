// node dependencies
const axios = require('axios')
const cheerio = require('cheerio')
const tmi = require('tmi.js')
const dotenv = require('dotenv')

// secure twitch oauth token for tmi
dotenv.config()

// global vars to track and prevent command spamming
let lastCommand
let lastUser
let commandCount = 0

// create tmi instance
const client = new tmi.Client({
  options: { debug: true },
  connection: {
    secure: true,
    reconnect: true,
  },
  identity: {
    username: process.env.TWITCH_BOT_USERNAME,
    password: process.env.TWITCH_OAUTH_TOKEN,
  },
  channels: [process.env.TWITCH_CHANNEL_NAME],
})

client.connect()

// chat command listener
client.on('message', (channel, tags, message, self) => {
  console.log('MESSAGE: ', message)
  if (self || !message.startsWith('!')) {
    return
  } 

  // parse command and options from message
  const args = message.slice(1).split(' ')
  const command = args.shift().toLowerCase()

  // function to execute chat command
  const runCommand = (command) => {
    switch (command) {
      // test command to verify client connection to twitch chat
      case 'test':
        client.say(
          channel,
          'Your Twitch chat is properly linked to this script!'
        )
        break
      // now playing
      case 'np':
        // *** NOTE ***

        // SERATO_DISPLAY_NAME is set to the user's Serato profile display name by default
        // When starting a Serato live playlist session the user can update/edit their display name.
        // If they do so, this bot will NOT work unless it's also updated match what's in their .env file

        // serato live playlist page to scrape
        const url = `https://serato.com/playlists/${process.env.SERATO_DISPLAY_NAME}/live`
        const scrapeData = async () => {
          try {
            const { data } = await axios.get(url)
            const $ = cheerio.load(data)
            const results = $('div.playlist-trackname')
            // return the most recent entry as chat response
            let nowplaying = results.last().text()
            // trim any leading whitespace from the response before posting
            client.say(channel, `Now playing: ${nowplaying.trim()}`)
          } catch (err) {
            console.error(err)
            client.say(channel, "Looks like that isn't working right now.")
          }
        }
        scrapeData()
        break

      // no response as default for any other command input
      default:
        break
    }
  }

  // user is limited to 2 consecutive uses of each command
  // beyond that cap, user is prompted to use another command
  const rateLimited = () => {
    client.say(
      channel,
      `${tags.username}, try a different command before using that one again.`
    )
  }

  // list of current commands in this script for our client connection to listen for
  const commandList = ['test', 'np']

  // check if command is in list
  if (commandList.includes(command)) {
    // check if the same user has entered the same command consecutively more than once
    if (lastCommand == command && lastUser == tags.username) {
      console.log(true)
      commandCount++
      console.log('COMMAND COUNT: ', commandCount)
      // redirect user to another command on rate limit
      if (commandCount === 3) {
        rateLimited()
        // ignore further commands from user if spamming
      } else if (commandCount > 3) {
        return
        // run command otherwise
      } else {
        runCommand(command)
      }
      // if not, call method/function that runs switch selector, set vars and counter
    } else {
      console.log(false)
      lastCommand = command
      lastUser = tags.username
      commandCount = 1
      runCommand(command)
    }
  } else {
    // if command is not in list, reset count and return w/o response
    // we only want this script to listen for commands within its purview
    commandCount = 0
    return
  }
})
