const clearOBSResponse = require('../../../obs/obsHelpers/obsHelpers')

const {
	NO_LIVE_DATA_MESSAGE,
	ERROR_MESSAGE,
} = require('../../constants/constants')

const displayShortestTrackMessage = (obs, tags, reportData, config) => {
	let message = `Shortest song in ${config.twitchChannelName}'s set so far : \n\n${reportData.shortest_track.name}\n${reportData.shortest_track.length_value} (played ${reportData.shortest_track.time_since_played_string})`
	obs.call('SetInputSettings', {
		inputName: 'npchatbot-response',
		inputSettings: {
			text: message,
		},
	})
	clearOBSResponse(obs, config.obsClearDisplayTime)
}

const shortestTrackCommand = async (
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
		}
		if (reportData.total_tracks_played < 4) {
			client.say(
				channel,
				`${config.twitchChannelName} hasn't played enough music in this stream just yet to determine the shortest song.`
			)
			return
		} else {
			client.say(
				channel,
				`The shortest song in ${config.twitchChannelName}'s set (so far) is ${reportData.shortest_track.name} (${reportData.shortest_track.length_value}), played ${reportData.shortest_track.time_since_played_string}`
			)
			if (config.isObsResponseEnabled === true) {
				displayShortestTrackMessage(obs, tags, reportData, config)
			}
		}
	} catch (error) {
		console.log('Shortest Track command error: ', error)
		client.say(channel, ERROR_MESSAGE)
	}
}

module.exports = {
	shortestTrackCommand: shortestTrackCommand,
}
