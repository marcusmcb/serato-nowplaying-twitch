const scrapeData = require('../liveReport/LiveReportHelpers/scrapeData')
const parseTimeValues = require('../liveReport/LiveReportHelpers/parseTimeValues')
const parseStartTime = require('../liveReport/LiveReportHelpers/parseStartTime')
const calculateAverageTime = require('../liveReport/LiveReportHelpers/calculateAverageTime')
const {
	extractPlaylistName,
	parseDateAndTime,
	createPlaylistDate,
	formatTimeSincePlayedString,
	calculateTimeDifference,
	compareTimes,
	sumTimeValues,
	removeLargestNumber,
	isDoubleOrMore,
	calculateAverageMilliseconds,
} = require('../liveReport/LiveReportHelpers/liveReportHelpers')

const createLiveReport = async (url) => {
	const playlistArtistName = extractPlaylistName(url)
	try {
		// function to scrape data for report
		const response = await scrapeData(url)
		const results = response[0]
		const timestamps = response[1]
		const starttime = response[2]
		const playlistdate = response[3]
		const playlistTitle = response[4]
		let tracksPlayed = []
		let trackTimestamps = []
		let doublesPlayed = []
		let timestampsParsed = []
		let startTimeString
		const starttimeParsed = createPlaylistDate(starttime, playlistdate)

		// parse start time for proper display in UI
		if (starttime.length === 7) {
			const [first, second] = parseStartTime(starttime, 5)
			startTimeString = first + ' ' + second.toUpperCase()
		} else {
			const [first, second] = parseStartTime(starttime, 4)
			startTimeString = first + ' ' + second.toUpperCase()
		}

		// loop through tracks played and clean data from scrape
		for (let i = 0; i < results.length; i++) {
			let trackId = results[i].children[0].data.trim()
			tracksPlayed.push(trackId)
		}

		// loop through track timestamps and clean data from scrape
		for (let j = 0; j < results.length; j++) {
			let timestamp = timestamps[j].children[0].data.trim()
			let timestampParsed = parseDateAndTime(timestamp, playlistdate)
			timestamp = new Date('01/01/1970 ' + timestamp)
			timestampsParsed.push(timestampParsed)
			trackTimestamps.push(timestamp)
		}

		// determine lengths of each track played
		let timeDiffs = []
		for (let k = 0; k < trackTimestamps.length; k++) {
			let x = trackTimestamps[k + 1] - trackTimestamps[k]
			if (Number.isNaN(x)) {
			} else {
				timeDiffs.push(x)
			}
		}

		// check for doubles and add those tracks to array
		for (let n = 0; n < tracksPlayed.length; n++) {
			if (tracksPlayed[n] === tracksPlayed[n + 1]) {
				doublesPlayed.push({
					name: tracksPlayed[n],
				})
			}
		}

		// master track log
		let trackLog = tracksPlayed.map((result, index) => {
			return {
				trackId: result,
				timestamp: sumTimeValues(starttimeParsed, timestampsParsed[index]),
				timePlayed: timestamps[index].children[0].data.trim(),
				length: timeDiffs[index],
			}
		})

		// create an array of track lengths in MS and send to
		// calculateAverageTime to convert and return average

		let msArray = []

		for (let i = 0; i < trackLog.length - 1; i++) {
			msArray.push(trackLog[i]['length'])
		}

		const longestTrackValue = Math.max(...msArray)
		const remainingArray = removeLargestNumber(msArray)
		const secondLongestTrackValue = Math.max(...remainingArray)
		const actualAverage = calculateAverageMilliseconds(msArray)
		const adjustedAverage = calculateAverageMilliseconds(remainingArray)

		const calculateAverage = (array) =>
			array.reduce((a, b) => a + b) / array.length

		const calculateStandardDeviation = (array) => {
			const mean = calculateAverage(array)
			const squaredDiffs = array.map((value) => Math.pow(value - mean, 2))
			const avgSquareDiff = calculateAverage(squaredDiffs)
			return Math.sqrt(avgSquareDiff)
		}

		const filterLongOutliers = (msArray, threshold = 2) => {
			const mean = calculateAverage(msArray)
			const stdDev = calculateStandardDeviation(msArray)

			const filteredArray = []
			const removedOutliers = []

			msArray.forEach((value) => {
				const zScore = (value - mean) / stdDev
				if (zScore < threshold) {
					filteredArray.push(value)
				} else {
					removedOutliers.push(value)
				}
			})

			console.log('Long Outliers Removed:', removedOutliers)
			return { filteredArray, removedOutliers }
		}

		const filterShortOutliers = (msArray, threshold = -2) => {
			const mean = calculateAverage(msArray)
			const stdDev = calculateStandardDeviation(msArray)

			const filteredArray = []
			const removedOutliers = []

			msArray.forEach((value) => {
				const zScore = (value - mean) / stdDev
				if (zScore > threshold) {
					filteredArray.push(value)
				} else {
					removedOutliers.push(value)
				}
			})

			console.log('Short Outliers Removed:', removedOutliers)
			return { filteredArray, removedOutliers }
		}

		// add method to calculate average time as MS for remainingArray

		// pass average time in MS from remaining array to
		// isDoubleOrMore and update method to  check if
		// longestTrackValue is more than double average time

		// console.log(isDoubleOrMore(longestTrackValue, secondLongestTrackValue))
		// console.log(isDoubleOrMore(actualAverage, adjustedAverage))

		let lastMSArray = msArray.slice(0, -1)

		console.log('MS Array: ', msArray)
		console.log('MS Array Length: ', msArray.length)
		console.log('---------------')
		// calculate average track length for the set
		// let averageTrackLength = calculateAverageTime(msArray)
		// let filteredMSArray = filterLongOutliers(msArray)
		// console.log('Filtered MS Array (Long): ', filteredMSArray)
		// console.log('Filtered MS Array Length: ', filteredMSArray.length)
		// console.log('---------------')
		// filteredMSArray = filterShortOutliers(filteredMSArray)
		// console.log('Filtered MS Array (Short): ', filteredMSArray)
		// console.log('Filtered MS Array Length: ', filteredMSArray.length)
		// console.log('---------------')
		// let averageTrackLength = calculateAverageTime(filteredMSArray)
		

		let { filteredArray: longFilteredMSArray, removedOutliers: longOutliers } =
			filterLongOutliers(msArray)
		let {
			filteredArray: finalFilteredMSArray,
			removedOutliers: shortOutliers,
		} = filterShortOutliers(longFilteredMSArray)

		let averageTrackLength = calculateAverageTime(finalFilteredMSArray)

		console.log('Long Outliers Removed:', longOutliers)
		console.log('Short Outliers Removed:', shortOutliers)

		console.log("Total Tracks Played: ", trackLog.length)

		// console.log('Longest Track Value: ', longestTrackValue)
		// console.log('Second Longest Track Value: ', secondLongestTrackValue)
		// console.log('Actual Average: ', actualAverage)
		// console.log('Adjusted Average: ', adjustedAverage)
		// console.log('---------------')

		// console.log("Remaining Array: ", remainingArray)

		console.log('---------------')

		let previousAverageTrackLength = calculateAverageTime(lastMSArray)
		// console.log(averageTrackLength)
		// console.log(previousAverageTrackLength)
		let averageDifference = compareTimes(
			averageTrackLength,
			previousAverageTrackLength
		)

		// * * * * * * * * * * * * * * *

		// determine best method to account for track length outliers
		// that are either abnormally long or short

		// * * * * * * * * * * * * * * *

		// longest track length behavior explained:

		// this is a quirk of the live playlist feature in Serato that
		// occurs when the current track playing is stopped and another
		// track is not immediately played thereafter.  Serato's live
		// playlist does not account for this, logging only the time that
		// each track begins playing.  if another track is not played
		// after the current one (ex, the DJ stops the music to speak
		// on mic) the "gap time" in the live playlist is simply added
		// to whichever song the DJ last played before the pause/break

		// this behavior results in an average track length that isn't
		// entirely accurate when used in the !stats command.  to account
		// for this, a helper method should be added to make the correct
		// determination for which averaging method should be used

		// * * * * * * * * * * * * * * *

		// shortest track length behavior explained:

		// by default any track with a length of less than 30 seconds
		// should be discarded when calculating the average track length
		// for the set (detailed reasoning explained in comments below)

		// * * * * * * * * * * * * * * *

		// longest track played

		// if lengthy track outliers are present in the playlist data,
		// use an alternate array of timeDiffs with the outlier
		// values removed when setting "max" value below
		// (likewise for the maxIndex value)

		let longestSeconds
		let max = Math.max(...timeDiffs)
		let maxIndex = timeDiffs.indexOf(max)
		let longestTrack = Math.abs(
			(trackTimestamps[maxIndex] - trackTimestamps[maxIndex + 1]) / 1000
		)
		let longestMinutes = Math.floor(longestTrack / 60) % 60
		let tempLongestSeconds = longestTrack % 60

		// check length of longest seconds for display parsing
		if (tempLongestSeconds.toString().length === 1) {
			longestSeconds = '0' + tempLongestSeconds
		} else {
			longestSeconds = tempLongestSeconds
		}

		// * * * * * * * * * * * * * * *

		// shortest track played logic

		// set a cutoff value to qualify a track as "played"
		// to account for live playlist errors that occur when
		// a DJ momentarily plays a portion of a track (cut sesssions, etc)
		// without playing it in full thereafter

		// any tracks below the cutoff length should be removed
		// from the timeDiffs array and used to calculate the
		// shorest track played below

		// add cutoff length as a dynamic value that can be set
		// by the user in the UI with a default value of 30 seconds
		// which will be used in dev/testing

		let shortestSeconds
		let min = Math.min(...timeDiffs)
		let minIndex = timeDiffs.indexOf(min)
		let shortestTrack = Math.abs(
			(trackTimestamps[minIndex] - trackTimestamps[minIndex + 1]) / 1000
		)
		let shortestMinutes = Math.floor(shortestTrack / 60) % 60
		let tempShortestSeconds = shortestTrack % 60

		// check length of shortest seconds for display parsing
		if (tempShortestSeconds.toString().length === 1) {
			shortestSeconds = '0' + tempShortestSeconds
		} else {
			shortestSeconds = tempShortestSeconds
		}

		// playlist length & parse hours/minutes/seconds
		let playlistLength = timestamps.last().text().trim()
		let playlistLengthValues = parseTimeValues(playlistLength)

		// playlist date formatting
		let playlistDateFormatted =
			playlistdate.split(' ')[1] +
			' ' +
			playlistdate.split(' ')[0] +
			', ' +
			playlistdate.split(' ')[2]

		const longestTrackDifference = calculateTimeDifference(
			trackLog[trackLog.length - 1].timestamp,
			trackLog[maxIndex].timestamp
		)
		const shortestTrackDifference = calculateTimeDifference(
			trackLog[trackLog.length - 1].timestamp,
			trackLog[minIndex].timestamp
		)

		const timeSinceLongestPlayed = formatTimeSincePlayedString(
			longestTrackDifference
		)
		const timeSinceShortestPlayed = formatTimeSincePlayedString(
			shortestTrackDifference
		)

		const seratoLiveReport = {
			track_length_array: timeDiffs,
			dj_name: playlistArtistName,
			set_length: {
				length_value: playlistLength,
				hours: new Number(playlistLengthValues[0]),
				minutes: new Number(playlistLengthValues[1]),
				seconds: new Number(playlistLengthValues[2]),
			},
			set_start_time: startTimeString,
			total_tracks_played: trackLog.length,
			longest_track: {
				name: trackLog[maxIndex].trackId,
				played_at: trackLog[maxIndex].timestamp,
				time_since_played: calculateTimeDifference(
					trackLog[trackLog.length - 1].timestamp,
					trackLog[maxIndex].timestamp
				),
				time_since_played_string: timeSinceLongestPlayed,
				length_value: longestMinutes + ':' + longestSeconds,
				minutes: longestMinutes,
				seconds: longestSeconds,
			},
			shortest_track: {
				name: trackLog[minIndex].trackId,
				played_at: trackLog[minIndex].timestamp,
				time_since_played: calculateTimeDifference(
					trackLog[trackLog.length - 1].timestamp,
					trackLog[minIndex].timestamp
				),
				time_since_played_string: timeSinceShortestPlayed,
				length_value: shortestMinutes + ':' + shortestSeconds,
				minutes: shortestMinutes,
				seconds: shortestSeconds,
			},
			average_track_length: averageTrackLength,
			average_change: {
				isLarger: averageDifference.averageIncrease,
				difference: averageDifference.difference,
			},
			track_log: trackLog,
			doubles_played: doublesPlayed,
			playlist_date: playlistDateFormatted,
			playlist_title: playlistTitle,
			track_array: tracksPlayed,
		}
		// console.log("---------------")
		// console.log("")
		// console.log("Serato Playlist Report: ")
		// console.log("")
		// console.log(seratoLiveReport)
		// console.log("")
		// console.log("---------------")

		console.log()

		return seratoLiveReport
	} catch (err) {
		console.log('Error creating Serato Live report: ', err)
	}
}
// FUTURE DEV NOTES
//
// calculate average tracks per hour for longer sets
//
// check if shortest track is part of a doubles pair
//
// add logic to determine longest track played @ time
// add logic to determine shortest track played @ time

module.exports = createLiveReport
