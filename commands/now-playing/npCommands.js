const createLiveReport = require('../stats/createLiveReport')
const clearOBSResponse = require('../../obs/obsHelpers/obsHelpers')
const { parseTimeString, vibeCheckSelector } = require("../now-playing/npCommandHelpers/npCommandHelpers")

const npCommands = async (channel, tags, args, client, obs, url, config) => {
	const obsClearDisplayTime = config.obsClearDisplayTime
	try {
		const reportData = await createLiveReport(url)
		const currentTrackPlaying =
			reportData.track_log[reportData.track_log.length - 1]
		const previousTrackPlayed =
			reportData.track_log[reportData.track_log.length - 2]
		const firstTrackPlayed = reportData.track_log[0]
		const vibeCheckSelection = vibeCheckSelector(reportData.track_log)

		if (reportData.track_log.length === 0) {
			client.say(
				channel,
				'No live playlist data for this stream at the moment.'
			)
		} else if (args[0] === undefined) {
			client.say(channel, `Now playing: ${currentTrackPlaying.trackId}`)
			if (config.isObsResponseEnabled === true) {
				obs.call('SetInputSettings', {
					inputName: 'obs-chat-response',
					inputSettings: {
						text: `Now playing:\n${currentTrackPlaying.trackId}`,
					},
				})
				clearOBSResponse(obs, obsClearDisplayTime)
			}
		} else if (args[0] === 'previous') {
			client.say(channel, `Now playing: ${previousTrackPlayed.trackId}`)
			if (config.isObsResponseEnabled === true) {
				obs.call('SetInputSettings', {
					inputName: 'obs-chat-response',
					inputSettings: {
						text: `Now playing:\n${previousTrackPlayed.trackId}`,
					},
				})
				clearOBSResponse(obs, obsClearDisplayTime)
			}
		} else if (args[0] === 'start') {
			client.say(
				channel,
				`${tags.username} kicked off this stream with ${firstTrackPlayed.trackId}`
			)
			if (config.isObsResponseEnabled === true) {
				obs.call('SetInputSettings', {
					inputName: 'obs-chat-response',
					inputSettings: {
						text: `${tags.username} kicked off this stream with :\n${firstTrackPlayed.trackId}`,
					},
				})
				clearOBSResponse(obs, obsClearDisplayTime)
			}
		} else if (args[0] === 'vibecheck') {
			const { hours, minutes, seconds } = parseTimeString(
				vibeCheckSelection.timeSincePlayed
			)

			if (hours > 0) {
				// if that hours value is > 1
				if (hours > 1) {
					client.say(
						channel,
						`${tags.username} played "${vibeCheckSelection.trackId}" ${hours} hours & ${minutes} minutes ago in this stream.`
					)
					if (config.isObsResponseEnabled === true) {
						obs.call('SetInputSettings', {
							inputName: 'obs-chat-response',
							inputSettings: {
								text: `vibecheck:\n\n${tags.username} played\n"${vibeCheckSelection.trackId}"\n${hours} hours & ${minutes} minutes ago in this stream.`,
							},
						})
						clearOBSResponse(obs, obsClearDisplayTime)
					}
				} else {
					client.say(
						channel,
						`${tags.username} played "${vibeCheckSelection.trackId}" ${hours} hour & ${minutes} minutes ago in this stream.`
					)
					if (config.isObsResponseEnabled === true) {
						obs.call('SetInputSettings', {
							inputName: 'obs-chat-response',
							inputSettings: {
								text: `vibecheck:\n\n${tags.username} played\n"${vibeCheckSelection.trackId}"\n${hours} hour & ${minutes} minutes ago in this stream.`,
							},
						})
						clearOBSResponse(obs, obsClearDisplayTime)
					}
				}
			} else {
				client.say(
					channel,
					`${tags.username} played "${vibeCheckSelection.trackId}" ${minutes} minutes ago in this stream.`
				)
				if (config.isObsResponseEnabled === true) {
					obs.call('SetInputSettings', {
						inputName: 'obs-chat-response',
						inputSettings: {
							text: `vibecheck:\n\n${tags.username} played\n"${vibeCheckSelection.trackId}"\n${minutes} minutes ago in this stream.`,
						},
					})
					setTimeout(() => {
						obs.call('SetInputSettings', {
							inputName: 'obs-chat-response',
							inputSettings: {
								text: '',
							},
						})
					}, 5000)
				}
			}
		} else if (args[0] === 'options') {
			client.say(
				channel,
				'Use the following commands to search through my play history: !np (current song), !np previous (previous song), !np start (first song), !np vibecheck (try it & find out), !stats, !doubles, !longestsong, !shortestsong, !dyp (artist name)'
			)
		}
	} catch (error) {
		console.log(error)
		client.say(channel, "That doesn't appear to be working right now.")
	}
}

module.exports = {
	npCommands: npCommands,
}
