const axios = require('axios')
const cheerio = require('cheerio')
const dotenv = require('dotenv')

dotenv.config()

const url = `https://serato.com/playlists/${process.env.SERATO_DISPLAY_NAME}/live`

const createSeratoReport = async () => {
  try {
    await axios
      .get(url)
      .then(({ data }) => {
        const $ = cheerio.load(data)
        const results = $('div.playlist-trackname')
        const timestamp = $('div.playlist-tracktime')

        let tracksPlayed = []

        // push tracks played so far to array
        for (let i = 0; i < results.length; i++) {
          let trackId = results[i].children[0].data.trim()
          tracksPlayed.push(trackId)
        }
      })
      .catch((error) => {
        if (error.response.status === 404) {
          process.stderr.write('Your Serato URL is incorrect.')
          client.say(channel, "That doesn't appear to be working right now.")
        }
      })
  } catch (err) {
    console.log(err)
  }
}

createSeratoReport()
