const createLiveReport = require('../liveReport/createLiveReport')
const clearOBSResponse = require('../../../obs/obsHelpers/obsHelpers')
const {
	NO_LIVE_DATA_MESSAGE,
	ERROR_MESSAGE,
} = require('../../constants/constants')

const timeDifference = (time1, time2) => {
	const convertToTimeDate = (timeStr) => {
		const [time, meridian] = timeStr.split(' ')
		const [hoursStr, minutesStr] = time.split(':')
		let hours = parseInt(hoursStr, 10)
		// Convert 12-hour format to 24-hour format
		if (meridian === 'PM' && hours !== 12) {
			hours += 12
		} else if (meridian === 'AM' && hours === 12) {
			hours = 0
		}
		const minutes = parseInt(minutesStr, 10)
		return hours * 60 + minutes
	}
	const timeInMinutes1 = convertToTimeDate(time1)
	const timeInMinutes2 = convertToTimeDate(time2)
	const diff = Math.abs(timeInMinutes1 - timeInMinutes2)
	return `${diff} minutes`
}

const dypCommand = async (channel, tags, args, client, obs, url, config) => {
	const obsClearDisplayTime = config.obsClearDisplayTime
	let searchItem = args.join(' ')
	// check if user has entered a query value after the command
	if (args.length === 0) {
		client.say(
			channel,
			`Add an artist's name after the command to see if ${config.twitchChannelName} has played them yet in this stream.`
		)
	} else {
		try {
			const reportData = await createLiveReport(url)
			if (reportData === undefined) {
				client.say(channel, NO_LIVE_DATA_MESSAGE)
				return
			} else if (reportData.total_tracks_played < 4) {
				client.say(
					channel,
					`${config.twitchChannelName} hasn't played enough music in this stream to search just yet.`
				)
				return
			} else {
				// add logic check for trackLog length here
				let searchResults = []
				let searchTerm = `${args}`.replaceAll(',', ' ')
				for (let i = 0; i < reportData.track_array.length; i++) {
					if (
						reportData.track_array[i]
							.toLowerCase()
							.includes(searchTerm.toLowerCase())
					) {
						searchResults.push(reportData.track_array[i])
					}
				}

				let timeStampsArray = []

				for (let i = 0; i < reportData.track_log.length; i++) {
					if (
						reportData.track_log[i].trackId
							.toLowerCase()
							.includes(searchTerm.toLowerCase())
					) {
						timeStampsArray.push({
							trackId: reportData.track_log[i].trackId,
							timestamp: reportData.track_log[i].timestamp,
						})
					}
				}

				if (searchResults.length === 0) {
					client.say(
						channel,
						`${config.twitchChannelName} has not played '${searchItem}' so far in this stream.`
					)
					if (config.isObsResponseEnabled === true) {
						obs.call('SetInputSettings', {
							inputName: 'obs-chat-response',
							inputSettings: {
								text: `${config.twitchChannelName} has not played\n'${searchItem}' so far in this stream.`,
							},
						})
						clearOBSResponse(obs, obsClearDisplayTime)
					}
				} else {
					console.log(timeStampsArray)
					const lastSongPlayed = searchResults[searchResults.length - 1]
					const queriedTrackTime = timeStampsArray[0].timestamp
					const currentTrackTime =
						reportData.track_log[reportData.track_log.length - 1].timestamp
					const timeSincePlayed = timeDifference(
						queriedTrackTime,
						currentTrackTime
					)

					if (searchResults.length === 1) {
						// add lastSongPlayed logic check here
						client.say(
							channel,
							`${config.twitchChannelName} has played '${searchItem}' ${searchResults.length} time so far in this stream. Their last song was \n${lastSongPlayed}, played ${timeSincePlayed} ago.`
						)
						if (config.isObsResponseEnabled === true) {
							obs.call('SetInputSettings', {
								inputName: 'obs-chat-response',
								inputSettings: {
									text: `${config.twitchChannelName} has played\n'${searchItem}' ${searchResults.length} time so far in this stream.\n\nTheir last song was: \n${lastSongPlayed} \n* played ${timeSincePlayed} ago`,
								},
							})
							clearOBSResponse(obs, obsClearDisplayTime)
						}
					} else {
						client.say(
							channel,
							`${config.twitchChannelName} has played '${searchItem}' ${searchResults.length} times so far in this stream. Their last song played was \n${lastSongPlayed}, played ${timeSincePlayed} ago.`
						)
						if (config.isObsResponseEnabled === true) {
							obs.call('SetInputSettings', {
								inputName: 'obs-chat-response',
								inputSettings: {
									text: `${config.twitchChannelName} has played\n'${searchItem}' ${searchResults.length} times so far in this stream.\n\nTheir last song played was: \n${lastSongPlayed} \n* played ${timeSincePlayed} ago`,
								},
							})
							clearOBSResponse(obs, obsClearDisplayTime)
						}
					}
				}
			}
		} catch (error) {
			console.log('DYP command error: ', error)
			client.say(channel, ERROR_MESSAGE)
		}
	}
}

module.exports = {
	dypCommand: dypCommand,
}
