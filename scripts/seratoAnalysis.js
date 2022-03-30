const axios = require('axios')
const cheerio = require('cheerio')
const dotenv = require('dotenv')

dotenv.config({ path: `../.env` })

const url = `https://serato.com/playlists/${process.env.SERATO_DISPLAY_NAME}/3-17-2022_1`
// test url
// const url = "https://serato.com/playlists/DJ_Marcus_McBride/3-17-2022_1"

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
        console.log("* * * * * * * * * * * * * * * * *")
        console.log(tracksPlayed)
        console.log("* * * * * * * * * * * * * * * * *")
      })
      .catch((error) => {
        if (error.response.status === 404) {
          process.stderr.write('Your Serato URL is incorrect.')          
        }
      })
  } catch (err) {
    console.log(err)
  }
}

createSeratoReport()
// call func to send email report w/stats & data
