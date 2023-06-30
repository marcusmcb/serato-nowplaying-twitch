const axios = require('axios')
const cheerio = require('cheerio')
const dotenv = require('dotenv')

const {
	parseDateAndTime,
	convertMilliseconds,
	parseTrackTimestamps,
	calculateTimeDifferences,
	calculateAverageTrackLength,
} = require('./helpers/statsHelpers')

dotenv.config()

const url = `https://serato.com/playlists/${process.env.SERATO_DISPLAY_NAME}/live`
// const url2 = 'https://serato.com/playlists/DJ_Marcus_McBride/3-12-2022'

const statsCommand = async (channel, tags, args, client, obs) => {
	try {
		const { data } = await axios.get(url)
		const $ = cheerio.load(data)

		const playlistDate = $('span.playlist-start-time').first().text().trim()
		const { timestampsParsed, trackTimestamps } = parseTrackTimestamps(
			$,
			playlistDate
		)
		const timeDiffs = calculateTimeDifferences(trackTimestamps)
		const averageTrackLength = calculateAverageTrackLength(timeDiffs)

		if (timeDiffs.length === 0) {
			client.say(
				channel,
				'Sorry, no playlist stats for this stream at the moment.'
			)
		} else {
			client.say(
				channel,
				`${channel.slice(1)} has played ${
					timeDiffs.length + 1
				} songs so far in this stream with an average length of ${averageTrackLength} per song.`
			)
			obs.call('SetInputSettings', {
				inputName: 'hello-command',
				inputSettings: {
					text: `${tags.username} has played ${
						timeDiffs.length + 1
					} songs so far\nin this stream at an average of ${averageTrackLength} per song`,
				},
			})
			setTimeout(() => {
				obs.call('SetInputSettings', {
					inputName: 'hello-command',
					inputSettings: {
						text: '',
					},
				})
			}, 8000)
		}
	} catch (err) {
		console.log(err)
		client.say(channel, "That doesn't appear to be working right now.")
	}
}

module.exports = {
	statsCommand: statsCommand,
}
