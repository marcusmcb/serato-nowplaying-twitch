const createLiveReport = require('../liveReport/createLiveReport')
const clearOBSResponse = require('../../../obs/obsHelpers/obsHelpers')
const { NO_LIVE_DATA_MESSAGE, ERROR_MESSAGE } = require('../../constants/constants')

const displayShortestTrackMessage = (obs, tags, reportData, config) => {
	let message = `Shortest song in ${tags.username}'s set so far : \n\n${reportData.shortest_track.name}\n${reportData.shortest_track.length_value} (played ${reportData.shortest_track.time_since_played_string})`
	obs.call('SetInputSettings', {
		inputName: 'obs-chat-response',
		inputSettings: {
			text: message,
		},
	})
	clearOBSResponse(obs, config.obsClearDisplayTime)
}

const shortestTrackCommand = async (
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
			client.say(
				channel,
				NO_LIVE_DATA_MESSAGE
			)
		} else {
			client.say(
				channel,
				`The shortest song in ${tags.username}'s set (so far) is ${reportData.shortest_track.name} (${reportData.shortest_track.length_value}), played ${reportData.shortest_track.time_since_played_string}`
			)
			if (config.isObsResponseEnabled === true) {
				displayShortestTrackMessage(obs, tags, reportData, config)
			}
		}
	} catch (error) {
		console.log(error)
		client.say(channel, ERROR_MESSAGE)
	}
}

module.exports = {
	shortestTrackCommand: shortestTrackCommand,
}
