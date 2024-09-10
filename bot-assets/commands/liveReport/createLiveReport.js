const scrapeData = require('../liveReport/LiveReportHelpers/scrapeData')

const {
	extractPlaylistName,
	parseDateAndTime,
	parseStartTime,
	createPlaylistDate,
	formatTimeSincePlayedString,
	calculateTimeDifference,
	compareTimes,
	sumTimeValues,
	filterLongOutliers,
	filterShortOutliers,
	calculateAverageTime,
	parseTimeValues,
} = require('../liveReport/LiveReportHelpers/liveReportHelpers')

const createLiveReport = async (url) => {
	const playlistArtistName = extractPlaylistName(url)
	try {
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
		let shortOutlierThreshold
		let longOutlierThreshold

		for (let i = 0; i < trackLog.length - 1; i++) {
			msArray.push(trackLog[i]['length'])
		}

		// set outlier thresholds based on number of tracks played so far
		if (trackLog.length < 50) {
			longOutlierThreshold = 2
			shortOutlierThreshold = -2
		} else {
			longOutlierThreshold = 3
			shortOutlierThreshold = -3
		}

		let lastMSArray = msArray.slice(0, -1)

		// filter out outliers from the track length array
		let { filteredArray: longFilteredMSArray, removedOutliers: longOutliers } =
			filterLongOutliers(msArray, longOutlierThreshold)
		let {
			filteredArray: finalFilteredMSArray,
			removedOutliers: shortOutliers,
		} = filterShortOutliers(longFilteredMSArray, shortOutlierThreshold)

		// determine the average track length for the set after outliers are removed
		let averageTrackLength = calculateAverageTime(finalFilteredMSArray)
		let previousAverageTrackLength = calculateAverageTime(lastMSArray)
		let averageDifference = compareTimes(
			averageTrackLength,
			previousAverageTrackLength
		)

		console.log('MS Array: ', msArray)
		console.log('MS Array Length: ', msArray.length)
		console.log('---------------')
		console.log('Long Outliers Removed:', longOutliers)
		console.log('Short Outliers Removed:', shortOutliers)
		console.log('Total Tracks Played: ', trackLog.length)
		// console.log('Longest Track Value: ', longestTrackValue)
		// console.log('Second Longest Track Value: ', secondLongestTrackValue)
		// console.log('Actual Average: ', actualAverage)
		// console.log('Adjusted Average: ', adjustedAverage)
		console.log('---------------')

		// * * * * * * * * * * * * * * *
		//
		// longest track length behavior explained:
		//
		// this is a quirk of the live playlist feature in Serato that
		// occurs when the current track playing is stopped and another
		// track is not immediately played thereafter.  Serato's live
		// playlist does not account for this, logging only the time that
		// each track begins playing.  if another track is not played
		// after the current one (ex, the DJ stops the music to speak
		// on mic) the "gap time" in the live playlist is simply added
		// to whichever song the DJ last played before the pause/break
		//
		// this behavior results in an average track length that isn't
		// entirely accurate when used in the !stats command.  to account
		// for this, a helper method should be added to make the correct
		// determination for which averaging method should be used
		//
		// * * * * * * * * * * * * * * *

		// Determine the longest track from the original array
		let longestSeconds,
			longestMinutes,
			maxIndex,
			longestTrackName,
			longestTrackPlayedAt,
			timeSinceLongestPlayed,
			lengthValue,
			longestTrack,
			tempLongestSeconds

		const longestTrackValue = Math.max(...msArray)
		const isOutlier = longOutliers.includes(longestTrackValue)

		maxIndex = msArray.indexOf(longestTrackValue)
		longestTrackName = trackLog[maxIndex].trackId
		longestTrackPlayedAt = trackLog[maxIndex].timestamp
		longestTrack = Math.abs(
			(trackTimestamps[maxIndex] - trackTimestamps[maxIndex + 1]) / 1000
		)
		longestMinutes = Math.floor(longestTrack / 60) % 60
		tempLongestSeconds = longestTrack % 60
		longestSeconds =
			tempLongestSeconds.toString().length === 1
				? '0' + tempLongestSeconds
				: tempLongestSeconds

		const longestTrackDifference = calculateTimeDifference(
			trackLog[trackLog.length - 1].timestamp,
			trackLog[maxIndex].timestamp
		)

		timeSinceLongestPlayed = formatTimeSincePlayedString(longestTrackDifference)
		lengthValue = `${longestMinutes}:${longestSeconds}`

		// * * * * * * * * * * * * * * *
		//
		// shortest track played logic
		//
		// set a cutoff value to qualify a track as "played"
		// to account for live playlist errors that occur when
		// a DJ momentarily plays a portion of a track (cut sessions, etc)
		// without playing it in full thereafter
		//
		// any tracks below the cutoff length should be removed
		// from the timeDiffs array and used to calculate the
		// shorest track played below
		//
		// add cutoff length as a dynamic value that can be set
		// by the user in the UI with a default value of 30 seconds
		// which will be used in dev/testing
		//
		// * * * * * * * * * * * * * * *

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

		const shortestTrackDifference = calculateTimeDifference(
			trackLog[trackLog.length - 1].timestamp,
			trackLog[minIndex].timestamp
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
				name: longestTrackName,
				played_at: longestTrackPlayedAt,
				time_since_played: timeSinceLongestPlayed,
				length_value: lengthValue,
				minutes: longestMinutes,
				seconds: longestSeconds,
				isOutlier: isOutlier,
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
		return seratoLiveReport
	} catch (err) {
		console.log('Error creating Serato Live report: ', err)
	}
}

module.exports = createLiveReport

// FUTURE DEV NOTES
//
// check if shortest track is part of a doubles pair
//
// add logic to determine longest track played @ time
//
// add logic to determine shortest track played @ time
