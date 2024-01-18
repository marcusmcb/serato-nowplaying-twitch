const convertToMilliseconds = (time) => {
	const [hours, minutes, seconds] = time.split(':').map(Number)
	return hours * 60 * 60 * 1000 + minutes * 60 * 1000 + seconds * 1000
}

const parseTimeString = (timeString) => {
	const parts = timeString.split(':')
	const hours = parseInt(parts[0], 10)
	const minutes = parseInt(parts[1], 10)
	const seconds = parseInt(parts[2], 10)
	return { hours, minutes, seconds }
}

const vibeCheckSelector = (tracks) => {
	if (tracks.length <= 1) {
		return null
	}
	const lastTrack = tracks[tracks.length - 1]
	const lastTrackTime = convertToMilliseconds(lastTrack.timePlayed)
	const randomIndex = Math.floor(Math.random() * (tracks.length - 1))
	const randomTrack = tracks[randomIndex]
	const randomTrackTime = convertToMilliseconds(randomTrack.timePlayed)
	const timeDifferenceMS = lastTrackTime - randomTrackTime
	const timeDifference = new Date(timeDifferenceMS)
		.toISOString()
		.substr(11, 8)
	return {
		trackId: randomTrack.trackId,
		timeSincePlayed: timeDifference,
	}
}

module.exports = {
  convertToMilliseconds: convertToMilliseconds,
  parseTimeString: parseTimeString,
  vibeCheckSelector: vibeCheckSelector
}