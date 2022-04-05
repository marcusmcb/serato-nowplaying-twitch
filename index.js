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

// global vars to track command usage and songs IDed
let npCommandCount = 0
let tracksIdentified = []
let userList = []

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

// add try/catch block here?
client.connect().catch(console.error)

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
  const currentUser = tags.username

  // url to scrape for user's Serato live playlist page
  const url = `https://serato.com/playlists/${process.env.SERATO_DISPLAY_NAME}/live`
  // url for script testing

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

      // dyp (did you play) command
      case 'dyp':
        if (args.length === 0) {
          client.say(
            channel,
            `Add an artist's name after the command to see if ${channelName} has played them yet in this stream.`
          )
          break
        } else {
          const searchSeratoData = async () => {
            try {
              await axios
                .get(url)
                .then(({ data }) => {
                  const $ = cheerio.load(data)
                  const results = $('div.playlist-trackname')
                  // const timestamp = $('div.playlist-tracktime')

                  let tracksPlayed = []

                  // push tracks played so far to array
                  for (let i = 0; i < results.length; i++) {
                    let trackId = results[i].children[0].data.trim()
                    tracksPlayed.push(trackId)
                  }

                  // search array for command option (artist)
                  let searchResults = []
                  let searchTerm = `${args}`.replaceAll(',', ' ')
                  console.log('-------------------------------------')
                  console.log('SEARCH TERM: ', searchTerm)
                  for (let i = 0; i < tracksPlayed.length; i++) {
                    if (
                      tracksPlayed[i]
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase())
                    ) {
                      searchResults.push(tracksPlayed[i])
                    }
                  }

                  // dev note - rewrite as proper async/await call
                  setTimeout(() => {
                    if (searchResults.length === 0) {
                      client.say(
                        channel,
                        `${channelName} has not played ${searchTerm} so far in this stream.`
                      )
                    } else if (searchResults.length === 1) {
                      client.say(
                        channel,
                        `${channelName} has played ${searchTerm} ${searchResults.length} time so far in this stream.`
                      )
                    } else if (searchResults.length > 1) {
                      console.log(searchResults)
                      client.say(
                        channel,
                        `${channelName} has played ${searchTerm} ${searchResults.length} times so far in this stream.`
                      )
                    }
                  }, 500)
                })
                .catch((error) => {
                  if (error.response.status === 404) {
                    process.stderr.write('Your Serato URL is incorrect.')
                    client.say(
                      channel,
                      "That doesn't appear to be working right now."
                    )
                  }
                })
            } catch (err) {
              console.log(err)
              // add process.stderr.write statement to handle possible errors
            }
          }
          searchSeratoData()
          break
        }

      // np command
      case 'np':
        npCommandCount++
        userList.push(currentUser)
        console.log('USERLIST: ', userList)
        const scrapeSeratoData = async () => {
          // check for !np options here BEFORE executing data scrape
          try {
            await axios
              .get(url)
              .then(({ data }) => {
                const $ = cheerio.load(data)
                const results = $('div.playlist-trackname')
                const timestamp = $('div.playlist-tracktime')

                // !np (default w/no options)
                if (args.length === 0) {
                  let nowplaying = results.last().text()
                  tracksIdentified.push(nowplaying.trim())
                  client.say(channel, `Now playing: ${nowplaying.trim()}`)

                  // !np previous
                } else if (args == 'previous') {
                  let previousTrack = results[results.length - 2]
                  tracksIdentified.push(previousTrack.children[0].data.trim())
                  client.say(
                    channel,
                    `Previous track: ${previousTrack.children[0].data.trim()}`
                  )

                  // !np start
                } else if (args == 'start') {
                  let firstTrack = results.first().text()
                  tracksIdentified.push(firstTrack.trim())
                  client.say(
                    channel,
                    `${channelName} kicked off this stream with ${firstTrack.trim()}`
                  )

                  // !np total
                } else if (args == 'total') {
                  client.say(
                    channel,
                    `${channelName} has played ${results.length} tracks so far in this stream.`
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

                  // calculate how long ago in the stream the random selection was played
                  // date strings are "fudged" for formatting purposes to easily make the time calculation
                  let x = new Date(`Jan 1, 2022 ${currentTrackTimestamp}`)
                  let y = new Date(`Jan 1, 2022 ${randomTrackTimestamp}`)
                  let res = Math.abs(x - y) / 1000
                  let hours = Math.floor(res / 3600) % 24
                  let minutes = Math.floor(res / 60) % 60
                  let seconds = res % 60

                  // if random index timestamp has an hours value
                  if (hours > 0) {
                    // if that hours value is > 1
                    if (hours > 1) {
                      client.say(
                        channel,
                        `${channelName} played "${randomTrack.children[0].data.trim()}" ${hours} hours & ${minutes} minutes ago in this stream.`
                      )
                    } else {
                      client.say(
                        channel,
                        `${channelName} played "${randomTrack.children[0].data.trim()}" ${hours} hour & ${minutes} minutes ago in this stream.`
                      )
                    }
                  } else {
                    client.say(
                      channel,
                      `${channelName} played "${randomTrack.children[0].data.trim()}" ${minutes} minutes ago in this stream.`
                    )
                  }

                  // !np options
                } else if (args == 'options') {
                  client.say(
                    channel,
                    'Command Options: !np (current song), !np start (first song), !np previous (previous song), !np vibecheck (try it & find out)'
                  )
                  // default catch-all for any args passed that are not defined
                } else {
                  client.say(
                    channel,
                    'Command Options: !np (current song), !np start (first song), !np previous (previous song), !np vibecheck (random song we already played)'
                  )
                }
                console.log(npCommandCount)
                console.log(tracksIdentified)
              })
              .catch((error) => {
                console.log(error)
                // expand error checking here as needed (currently working for Serato errors)
                if (error.response.status === 404) {
                  process.stderr.write('Your Serato URL is incorrect.')
                  client.say(
                    channel,
                    "That doesn't appear to be working right now."
                  )
                }
              })
          } catch (err) {
            console.log(err)
            // add process.stderr.write statement to handle possible errors
          }
        }
        scrapeSeratoData()
        break

      // no response as default for any other command input
      default:
        break
    }
  }

  // user is limited to 6 consecutive uses of each command
  // beyond that cap, user is prompted to use another command
  const rateLimited = () => {
    client.say(
      channel,
      `${tags.username}, try a different command before using that one again.`
    )
  }

  // master list of current commands in this script for our client connection to listen for
  // any commands added/updated above need to be added/updated here
  const commandList = ['test', 'np', 'dyp']

  // check if command is in list
  if (commandList.includes(command)) {
    // check if the same user has entered the same command consecutively more than once
    if (lastCommand == command && lastUser == tags.username) {
      commandCount++
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

// add ignorelist for args passed to !dyp that aren't proper artist names (pronouns, letters, etc)
// return custom response if matched
// pass user settings from .env to params in script (rate limiting, feature availability, etc)