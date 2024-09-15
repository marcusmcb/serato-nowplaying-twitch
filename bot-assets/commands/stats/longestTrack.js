const clearOBSResponse = require('../../../obs/obsHelpers/obsHelpers')

const {
	NO_LIVE_DATA_MESSAGE,
	ERROR_MESSAGE,
} = require('../../constants/constants')

const displayLongestTrackMessage = (obs, tags, reportData, config) => {
	let message = `Longest song in ${config.twitchChannelName}'s set so far : \n\n${reportData.longest_track.name}\n${reportData.longest_track.length_value} (played ${reportData.longest_track.time_since_played})`
	obs.call('SetInputSettings', {
		inputName: 'npchatbot-response',
		inputSettings: {
			text: message,
		},
	})
	clearOBSResponse(obs, config.obsClearDisplayTime)
}

const longestTrackCommand = async (
	channel,
	client,
	reportData,
	obs,	
	config,
	tags
) => {
	try {
		if (reportData === undefined) {
			client.say(channel, NO_LIVE_DATA_MESSAGE)
			return
		} else if (reportData.total_tracks_played < 4) {
			client.say(
				channel,
				`${config.twitchChannelName} hasn't played enough music in this stream just yet to determine the longest song.`
			)
			return
		} else if (reportData.longest_track.isOutlier === true) {
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
	} catch (error) {
		console.log('Longest Track command error: ', error)
		client.say(channel, ERROR_MESSAGE)
	}
}

module.exports = {
	longestTrackCommand: longestTrackCommand,
}
