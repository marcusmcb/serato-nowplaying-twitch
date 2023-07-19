const parseDateAndTime = (timeString, playlistDate) => {
	const date = new Date(playlistDate)
	const [hours, minutes, seconds] = timeString.split(':')
	date.setHours(parseInt(hours, 10))
	date.setMinutes(parseInt(minutes, 10))
	date.setSeconds(parseInt(seconds, 10))
	return date
}

const convertMilliseconds = (milliseconds) => {
	const minutes = Math.floor(milliseconds / 60000)
	const seconds = ((milliseconds % 60000) / 1000).toFixed(0)
	return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
}

const parseTrackTimestamps = ($, playlistDate) => {
	const results = $('div.playlist-trackname')
	const timestamps = $('div.playlist-tracktime')
	const playlistStartTime = $('span.playlist-start-time').first().text().trim()
	const timestampsParsed = []
	const trackTimestamps = []

	for (let j = 0; j < results.length; j++) {
		const timestamp = timestamps[j].children[0].data.trim()
		const timestampParsed = parseDateAndTime(timestamp, playlistDate)
		const timestampIn1970 = new Date(`01/01/1970 ${timestamp}`)
		timestampsParsed.push(timestampParsed)
		trackTimestamps.push(timestampIn1970)
	}

	return { timestampsParsed, trackTimestamps, playlistDate }
}

const calculateTimeDifferences = (trackTimestamps) => {
	const timeDiffs = []

	for (let k = 0; k < trackTimestamps.length - 1; k++) {
		const timeDiff = trackTimestamps[k + 1] - trackTimestamps[k]
		if (!Number.isNaN(timeDiff)) {
			timeDiffs.push(timeDiff)
		}
	}

	return timeDiffs
}

const calculateAverageTrackLength = (timeDiffs) => {
	const averageMs =
		timeDiffs.reduce((acc, diff) => acc + diff, 0) / timeDiffs.length
	const averageTrackLength = convertMilliseconds(averageMs)
	return averageTrackLength
}

module.exports = {
	parseDateAndTime: parseDateAndTime,
	convertMilliseconds: convertMilliseconds,
	parseTrackTimestamps: parseTrackTimestamps,
	calculateTimeDifferences: calculateTimeDifferences,
	calculateAverageTrackLength: calculateAverageTrackLength,
}
