const dotenv = require('dotenv')
const scrapeData = require('./scrapeData')
const convertTimestamp = require('./convertTimestamp')

dotenv.config({ path: `../.env` })

// url for testing
const url = `https://serato.com/playlists/${process.env.SERATO_DISPLAY_NAME}/3-17-2022_1`

const createSeratoReport = async () => {
  try {
    // function to scrape data for report
    let response = await scrapeData(url)
    let results = response[0]
    let timestamps = response[1]

    let tracksPlayed = []
    let trackTimestamps = []

    // loop through tracks played and clean data from scrape
    for (let i = 0; i < results.length; i++) {
      let trackId = results[i].children[0].data.trim()
      tracksPlayed.push(trackId)
    }
    // loop through track timestamps and clean data from scrape
    for (let j = 0; j < results.length; j++) {
      let timestamp = timestamps[j].children[0].data.trim()
      timestamp = new Date('01/01/2020 ' + timestamp)
      trackTimestamps.push(timestamp)
    }

    // combine cleaned data into array of objects
    let trackLog = tracksPlayed.map((result, index) => {
      return { trackId: result, timestamp: trackTimestamps[index] }
    })
    console.log('* * * * * * * * * * * * * * * * *')
    console.log(trackLog)
    console.log('* * * * * * * * * * * * * * * * *')

    console.log('Total tracks played: ', trackLog.length)

    // determine lengths of each track played
    let timeDiffs = []
    for (let k = 0; k < trackTimestamps.length; k++) {
      let x = trackTimestamps[k + 1] - trackTimestamps[k]
      if (Number.isNaN(x)) {
      } else {
        timeDiffs.push(x)
      }
    }    

    // longest track played
    let max = Math.max(...timeDiffs)
    let maxIndex = timeDiffs.indexOf(max)
    console.log('Longest track played: ', trackLog[maxIndex].trackId)
    let longestTrack = Math.abs(
      (trackTimestamps[maxIndex] - trackTimestamps[maxIndex + 1]) / 1000
    )
    let longestMinutes = Math.floor(longestTrack / 60) % 60
    let longestSeconds = longestTrack % 60
    if (longestSeconds < 10) {
      longestSeconds = '0' + longestSeconds
      console.log(longestMinutes + ':' + longestSeconds)
    } else {
      console.log(longestMinutes + ':' + longestSeconds)
    }

    // shortest track played
    let min = Math.min(...timeDiffs)
    let minIndex = timeDiffs.indexOf(min)
    console.log('Shortest Track Played: ', trackLog[minIndex].trackId)
    let shortestTrack = Math.abs(
      (trackTimestamps[minIndex] - trackTimestamps[minIndex + 1]) / 1000
    )
    let shortestMinutes = Math.floor(shortestTrack / 60) % 60
    let shortestSeconds = shortestTrack % 60
    if (shortestSeconds < 10) {
      shortestSeconds = '0' + shortestSeconds
      console.log(shortestMinutes + ':' + shortestSeconds)
    } else {
      console.log(shortestMinutes + ':' + shortestSeconds)
    }

    // average track length played
    let sumDiff = 0
    for (let m = 0; m < timeDiffs.length; m++) {
      sumDiff += timeDiffs[m]
    }
    let avg = sumDiff / timeDiffs.length
    let w = (avg / 1000).toFixed()
    let minutes = Math.floor(w / 60) % 60
    let seconds = w % 60
    if (seconds < 10) {
      seconds = '0' + seconds
      console.log('Average Track Length Played: ', minutes + ':' + seconds)
    } else {
      console.log('Average Track Length Played: ', minutes + ':' + seconds)
    }
  } catch (err) {
    console.log(err)
  }
}

createSeratoReport()
// call func to send email report w/stats & data

// FUTURE DEV NOTES
//
// Rewrite this whole script as a standalone webpage
// All the user has to do is copy/paste the link to
// their Serato playlist page and hit analayze
//
// User option to download summary
// User option to aggregate summary (requires data storage $$)
