const createLiveReport = require('../stats/createLiveReport')
const clearOBSResponse = require('../../obs/obsHelpers/obsHelpers')

const convertToMilliseconds = (time) => {
	const [hours, minutes, seconds] = time.split(':').map(Number)
	return hours * 60 * 60 * 1000 + minutes * 60 * 1000 + seconds * 1000
}

const vibeCheck = (tracks) => {
	// If there's no track or just one, can't compute difference.
	if (tracks.length <= 1) {
		return null
	}

	// Get the most recent track's timePlayed.
	const lastTrack = tracks[tracks.length - 1]
	const lastTrackTime = convertToMilliseconds(lastTrack.timePlayed)

	// Get a random track (but not the last one).
	const randomIndex = Math.floor(Math.random() * (tracks.length - 1))
	const randomTrack = tracks[randomIndex]
	const randomTrackTime = convertToMilliseconds(randomTrack.timePlayed)

	// Compute the difference in time.
	const timeDifferenceMillis = lastTrackTime - randomTrackTime
	const timeDifference = new Date(timeDifferenceMillis)
		.toISOString()
		.substr(11, 8) // format as HH:MM:SS

	return {
		trackId: randomTrack.trackId,
		timeSincePlayed: timeDifference,
	}
}

const nowPlayingCommand = async (
	channel,
	tags,
	args,
	client,
	obs,
	url,
	config
) => {
	console.log("ARGS?: ", args)
	try {
		const reportData = await createLiveReport(url)
		const currentTrackPlaying =
			reportData.track_log[reportData.track_log.length - 1]
		const previousTrackPlayed =
			reportData.track_log[reportData.track_log.length - 2]
		const firstTrackPlayed = reportData.track_log[0]
		const vibeCheckSelection = vibeCheck(reportData.track_log)

		console.log("FIRST TRACK: ")
    console.log(firstTrackPlayed)
    console.log("CURRENT TRACK: ")
		console.log(currentTrackPlaying)
    console.log("PREVIOUS TRACK: ")
		console.log(previousTrackPlayed)
		console.log("VIBE CHECK: ")
    console.log(vibeCheckSelection)

    if (args === 'previous') {

    } else if (args === 'start') {

    } else if (args === 'vibecheck') {

    } else {
      
    }

		// console.log(reportData.track_log)

		// await createLiveReport(url).then((data) => {
		//   console.log("DATA: ", data.track_log[data.track_log.length - 1])
		// 	// console.log('NP DATA: ', data.track_log[track_log.length - 1])
		// })
	} catch (error) {
		console.log(error)
		client.say(channel, "That doesn't appear to be working right now.")
	}
}

module.exports = nowPlayingCommand
