const createLiveReport = require('./createLiveReport')
const clearOBSResponse = require('../../obs/obsHelpers/obsHelpers')

const doublesCommand = async (
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
		if (reportData.total_tracks_played === 0) {
			client.say(
				channel,
				'Sorry, no playlist stats for this stream at the moment.'
			)
		} else if (reportData.doubles_played.length === 0) {
			client.say(
				channel,
				`${channel.slice(1)} has not rocked doubles so far in this set.`
			)
			if (config.isObsResponseEnabled === true) {
				obs.call('SetInputSettings', {
					inputName: 'obs-chat-response',
					inputSettings: {
						text: `${tags.username} has not rocked doubles so far in this set.`,
					},
				})
				clearOBSResponse(obs, config.obsClearDisplayTime)
			}
		} else {
			client.say(
				channel,
				`${channel.slice(1)} has rocked doubles ${
					reportData.doubles_played.length
				} time(s) so far in this set.`
			)
			if (config.isObsResponseEnabled === true) {
				obs.call('SetInputSettings', {
					inputName: 'obs-chat-response',
					inputSettings: {
						text: `${tags.username} has rocked doubles\n${
							reportData.doubles_played.length
						} time(s) so far in this set.\n\nLast song he played doubles with:\n${
							reportData.doubles_played[reportData.doubles_played.length - 1]
								.name
						}`,
					},
				})
				clearOBSResponse(obs, config.obsClearDisplayTime)
			}
		}
	} catch (error) {
		console.log(error)
		client.say(channel, "That doesn't appear to be working right now.")
	}
}

module.exports = {
	doublesCommand: doublesCommand,
}
