const createLiveReport = require('../liveReport/createLiveReport')
const clearOBSResponse = require('../../../obs/obsHelpers/obsHelpers')
const {
	NO_LIVE_DATA_MESSAGE,
	ERROR_MESSAGE,
} = require('../../constants/constants')

const displayLongestTrackMessage = (obs, tags, reportData, config) => {
	let message = `Longest song in ${config.twitchChannelName}'s set so far : \n\n${reportData.longest_track.name}\n${reportData.longest_track.length_value} (played ${reportData.longest_track.time_since_played})`
	obs.call('SetInputSettings', {
		inputName: 'obs-chat-response',
		inputSettings: {
			text: message,
		},
	})
	clearOBSResponse(obs, config.obsClearDisplayTime)
}

const longestTrackCommand = async (
	channel,
	tags,
	args,
	client,
	obs,
	url,
	config
) => {
	try {
		const reportData = await createLiveReport(url)
		if (reportData === undefined) {
			client.say(channel, NO_LIVE_DATA_MESSAGE)
		} else {
			if (reportData.longest_track.isOutlier === true) {
				client.say(
					channel,
					`The longest song in ${config.twitchChannelName}'s set (so far) is ${reportData.longest_track.name}, played ${reportData.longest_track.time_since_played}.`
				)
			} else {
				client.say(
					channel,
					`The longest song in ${config.twitchChannelName}'s set (so far) is ${reportData.longest_track.name} (${reportData.longest_track.length_value}), played ${reportData.longest_track.time_since_played}.`
				)
			}
			if (config.isObsResponseEnabled === true) {
				displayLongestTrackMessage(obs, tags, reportData, config)
			}
		}
	} catch (error) {
		console.log('Longest Track command error: ', error)
		client.say(channel, ERROR_MESSAGE)
	}
}

module.exports = {
	longestTrackCommand: longestTrackCommand,
}
