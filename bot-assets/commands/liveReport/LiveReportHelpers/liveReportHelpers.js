// extract playlist name from serato scrape
const extractPlaylistName = (inputString) => {
	// Extract the portion of the string between 'playlists/' and '/4-3-2023'
	const regex = /playlists\/(.*?)\//
	const match = regex.exec(inputString)
	if (match && match[1]) {
		const playlistName = match[1].replace(/_/g, ' ')
		return playlistName
	} else {
		return null
	}
}

// parse set length from serato scrape
const parseDateAndTime = (timeString, playlistDate) => {
	const date = new Date(playlistDate)
	const [hours, minutes, seconds] = timeString.split(':')
	date.setHours(parseInt(hours, 10))
	date.setMinutes(parseInt(minutes, 10))
	date.setSeconds(parseInt(seconds, 10))
	return date
}

// parse playlist data from serato scrape
const createPlaylistDate = (timeString, playlistDate) => {
	let dateParts = playlistDate.split(' ')
	let dateObj = new Date(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`)
	let period = timeString.slice(-2) // AM or PM
	let [hours, minutes] = timeString.slice(0, -2).split(':') // Actual hours and minutes

	// Adjust hours for PM times
	if (period.toLowerCase() === 'pm' && hours !== '12') {
		hours = parseInt(hours) + 12
	} else if (period.toLowerCase() === 'am' && hours === '12') {
		hours = '00'
	}
	dateObj.setHours(hours, minutes)
	return dateObj
}

// helper method to convert to 24 hour format
const convertTo24Hour = (time) => {
	const [, hours, minutes, seconds, modifier] =
		/(\d{2}):(\d{2}):(\d{2}) (AM|PM)/.exec(time)

	let hr = parseInt(hours, 10)

	if (modifier === 'PM' && hr < 12) {
		hr += 12
		s
	} else if (modifier === 'AM' && hr === 12) {
		hr = 0
	}
	return `${hr}:${minutes}:${seconds}`
}

// parse time since a given track was played
const formatTimeSincePlayedString = (timeString) => {
	if (timeString.split(':')[0] === '00') {
		if (timeString.split(':')[1][0] === '0') {
			timeStringFormatted = `${timeString.split(':')[1][1]} minutes ago`
		} else {
			timeStringFormatted = `${timeString.split(':')[1]} minutes ago`
		}
	} else if (timeString.split(':')[1] === '00') {
		if (timeString.split(':')[2][0] === '0') {
			timeStringFormatted = `${timeString.split(':')[2][1]} seconds ago`
		} else {
			timeStringFormatted = `${timeString.split(':')[2]} seconds ago`
		}
	} else {
		// finish logic for this case
		let hours = timeString.split(':')[0]
		let minutes = timeString.split(':')[1]
		console.log('HOURS: ', hours, 'MINUTES: ', minutes)
		if (hours[0] === '0') {
			hours = hours[1]
		}
		if (minutes[0] === '0') {
			minutes = minutes[1]
		}
		// if hours > 1, add 's' to 'hour'
		timeStringFormatted = `${hours} hour and ${minutes} minutes ago`
	}
	return timeStringFormatted
}

// helper method to calculate difference between timestamps
const calculateTimeDifference = (currentTimestamp, previousTimestamp) => {
	const current24Hour = convertTo24Hour(currentTimestamp)
	const previous24Hour = convertTo24Hour(previousTimestamp)
	const currentDate = new Date(`1970-01-01 ${current24Hour}`)
	const previousDate = new Date(`1970-01-01 ${previous24Hour}`)

	let diff = Math.abs(currentDate.getTime() - previousDate.getTime())
	const hours = Math.floor(diff / 3_600_000)
	diff -= hours * 3_600_000
	const minutes = Math.floor(diff / 60_000)
	diff -= minutes * 60_000
	const seconds = Math.floor(diff / 1_000)
	const formatTime = (val) => String(val).padStart(2, '0')
	return `${formatTime(hours)}:${formatTime(minutes)}:${formatTime(seconds)}`
}

// helper method to parse & compare current average track length to previous
const compareTimes = (currentAverage, previousCurrentAverage) => {
	function parseTime(timeStr) {
		const [hours, minutes] = timeStr.split(':').map(Number)
		return hours * 60 * 60 * 1000 + minutes * 60 * 1000
	}

	const current = parseTime(currentAverage)
	const previous = parseTime(previousCurrentAverage)

	if (current > previous) {
		const difference = ((current - previous) / previous) * 100
		return {
			averageIncrease: true,
			difference: difference.toFixed(2),
		}
	} else if (current < previous) {
		const difference = ((previous - current) / previous) * 100
		return {
			averageIncrease: false,
			difference: difference.toFixed(2),
		}
	} else {
		return {
			averageIncrease: false,
			difference: null,
		}
	}
}

// helper method to add time values
const sumTimeValues = (timeValue1, timeValue2) => {
	// Extract hours, minutes, and seconds from the time values
	const date1 = new Date(timeValue1)
	const date2 = new Date(timeValue2)
	const hours1 = date1.getHours()
	const minutes1 = date1.getMinutes()
	const seconds1 = date1.getSeconds()
	const hours2 = date2.getHours()
	const minutes2 = date2.getMinutes()
	const seconds2 = date2.getSeconds()

	// Calculate the total time in seconds
	const totalSeconds =
		seconds1 +
		seconds2 +
		minutes1 * 60 +
		minutes2 * 60 +
		hours1 * 3600 +
		hours2 * 3600

	// Convert the total time to hours, minutes, and seconds
	const hours = Math.floor(totalSeconds / 3600) % 12
	const minutes = Math.floor((totalSeconds % 3600) / 60)
	const seconds = totalSeconds % 60

	// Determine whether it's AM or PM
	const ampm = hours < 12 ? 'AM' : 'PM'

	// Format the result as HH:MM:SS AM/PM
	const formattedHours = String(hours).padStart(2, '0')
	const formattedMinutes = String(minutes).padStart(2, '0')
	const formattedSeconds = String(seconds).padStart(2, '0')
	const result = `${formattedHours}:${formattedMinutes}:${formattedSeconds} ${ampm}`
	return result
}

// helper method to calculate standard deviation
// used in determining if a track is an outlier
const calculateStandardDeviation = (array) => {
	const mean = calculateAverage(array)
	const squaredDiffs = array.map((value) => Math.pow(value - mean, 2))
	const avgSquareDiff = calculateAverage(squaredDiffs)
	return Math.sqrt(avgSquareDiff)
}

// helper method to calculate average
const calculateAverage = (array) => {
	return array.reduce((a, b) => a + b) / array.length
}

const filterLongOutliers = (msArray, longOutlierThreshold) => {
	const mean = calculateAverage(msArray)
	const stdDev = calculateStandardDeviation(msArray)
	const filteredArray = []
	const removedOutliers = []
	msArray.forEach((value) => {
		const zScore = (value - mean) / stdDev
		if (zScore < longOutlierThreshold) {
			filteredArray.push(value)
		} else {
			removedOutliers.push(value)
		}
	})
	console.log('Long Outliers Removed:', removedOutliers)
	return { filteredArray, removedOutliers }
}

const filterShortOutliers = (msArray, shortOutlierThreshold) => {
	const mean = calculateAverage(msArray)
	const stdDev = calculateStandardDeviation(msArray)
	const filteredArray = []
	const removedOutliers = []
	msArray.forEach((value) => {
		const zScore = (value - mean) / stdDev
		if (zScore > shortOutlierThreshold) {
			filteredArray.push(value)
		} else {
			removedOutliers.push(value)
		}
	})
	console.log('Short Outliers Removed:', removedOutliers)
	return { filteredArray, removedOutliers }
}

module.exports = {
	extractPlaylistName,
	parseDateAndTime,
	createPlaylistDate,
	convertTo24Hour,
	formatTimeSincePlayedString,
	calculateTimeDifference,
	compareTimes,
	sumTimeValues,
	calculateStandardDeviation,
	calculateAverage,
	filterLongOutliers,
	filterShortOutliers,
}
