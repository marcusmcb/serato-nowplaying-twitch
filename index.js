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
  const channelName = channel.slice(1).split('#')

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
        // *** NOTES ***

        // test page to scrape:
        //
        const url = `https://serato.com/playlists/${process.env.SERATO_DISPLAY_NAME}/3-6-2022_2`
        //
        // * check to see if editing/updating display name in live playlist details alters the live URL

        // serato live playlist page to scrape
        // const url = `https://serato.com/playlists/${process.env.SERATO_DISPLAY_NAME}/live`
        const scrapeData = async () => {
          try {
            const { data } = await axios.get(url)
            const $ = cheerio.load(data)
            const results = $('div.playlist-trackname')
            const timestamp = $('div.playlist-tracktime')

            // default option
            if (args.length === 0) {
              let nowplaying = results.last().text()
              client.say(channel, `Now playing: ${nowplaying.trim()}`)

              // !np previous
            } else if (args == 'previous') {
              let previousTrack = results[results.length - 2]
              client.say(
                channel,
                `Previous track: ${previousTrack.children[0].data.trim()}`
              )

              // !np vibecheck
            } else if (args == 'vibecheck') {
              // select random index & parse track and timestamp data from the result
              let randomIndex = Math.floor(Math.random() * results.length)
              let randomTrack = results[randomIndex]
              let randomTrackTimestamp = timestamp[randomIndex]
              randomTrackTimestamp =
                randomTrackTimestamp.children[0].data.trim()
              let currentTrackTimestamp = timestamp.last().text()
              currentTrackTimestamp = currentTrackTimestamp.trim()

              // NOTE - the Serato live playlist page doesn't return a full Date timestamp
              // Jan 1, 2020 is used as a filler/dummy value in the interim
              // add logic to parse the current date portion from Date.now() and concat to
              // values listed below

              // calculate how long along the random selection was played
              let x = new Date(`Jan 1, 2020 ${currentTrackTimestamp}`)
              let y = new Date(`Jan 1, 2020 ${randomTrackTimestamp}`)
              let res = Math.abs(x - y) / 1000
              let hours = Math.floor(res / 3600) % 24
              let minutes = Math.floor(res / 60) % 60
              let seconds = res % 60

              // if random index timestamp has an hours value
              if (hours > 0) {
                client.say(
                  channel,
                  `${channelName} played "${randomTrack.children[0].data.trim()}" ${hours} hour & ${minutes} minutes ago in this stream.`
                )
              } else {
                client.say(
                  channel,
                  `${channelName} played "${randomTrack.children[0].data.trim()}" ${minutes} minutes ago in this stream.`
                )
              }

              // !np start
            } else if (args == 'start') {
              let firstTrack = results.first().text()
              client.say(
                channel,
                `${channelName} kicked off this stream with ${firstTrack.trim()}`
              )

              // !np options
            } else if (args == 'options') {
              client.say(
                channel,
                'Command Options: !np (current song), !np start (first song), !np previous (previous song), !np vibecheck (random song we already played)'
              )
              // default catch-all for any args passed that are undefined
            } else {
              client.say(
                channel,
                'Command Options: !np (current song), !np start (first song), !np previous (previous song), !np vibecheck (random song we already played)'
              )
            }
          } catch (err) {
            // if the scrape fails
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
      if (commandCount === 6) {
        rateLimited()
        // ignore further commands from user if spamming
      } else if (commandCount > 6) {
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
    // we only want this script to listen for commands within the commandList
    // prevents response and rate-limiting conflicts w/other bots configured for the same channel
    commandCount = 0
    // reset args
    return
  }
})

// RATE-LIMITING / MESSAGE LISTENER
//
// add timestamp to duplicate command to set "cool out" period for command's next use by user
// set "cool out" period per user or per command or both?
//
// FRONT END / DESKTOP APP
//
// electron.js?
//
// pc / mobile / mac (how many stream from macs?)
