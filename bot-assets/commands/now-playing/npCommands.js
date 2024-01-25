const createLiveReport = require('../liveReport/createLiveReport')
const clearOBSResponse = require('../../../obs/obsHelpers/obsHelpers')
const { NO_LIVE_DATA_MESSAGE, ERROR_MESSAGE } = require('../../constants/constants')
const {
	parseTimeString,
	vibeCheckSelector,
} = require('../now-playing/npCommandHelpers/npCommandHelpers')

const NP_OPTIONS =
	'npChatbot options: !np, !np previous, !np start, !np vibecheck, !dyp (query), !stats, !doubles, !shortestsong, !longestsong'

const updateOBSWithText = (obs, text, obsClearDisplayTime, config) => {
	if (config.isObsResponseEnabled) {
		obs.call('SetInputSettings', {
			inputName: 'obs-chat-response',
			inputSettings: { text },
		})
		clearOBSResponse(obs, obsClearDisplayTime)
	}
}

// !np options response
const handleOptions = (channel, client) => {
	const message =
		'Use the following commands to search through my play history: !np (current song), !np previous (previous song), !np start (first song), !np vibecheck (try it & find out), !stats, !doubles, !longestsong, !shortestsong, !dyp (artist name)'
	client.say(channel, message)
}

// !np response
const handleDefault = (
	channel,
	client,
	reportData,
	obs,
	obsClearDisplayTime,
	config
) => {
	const currentTrackPlaying =
		reportData.track_log[reportData.track_log.length - 1]
	const message = `Now playing: ${currentTrackPlaying.trackId}`
	client.say(channel, message)
	updateOBSWithText(
		obs,
		`Now playing:\n${currentTrackPlaying.trackId}`,
		obsClearDisplayTime,
		config
	)
}

// !np previous response
const handlePrevious = (
	channel,
	client,
	reportData,
	obs,
	obsClearDisplayTime,
	config
) => {
	const previousTrackPlayed =
		reportData.track_log[reportData.track_log.length - 2]
	const message = `Previous song: ${previousTrackPlayed.trackId}`
	client.say(channel, message)
	updateOBSWithText(
		obs,
		`Previous song:\n${previousTrackPlayed.trackId}`,
		obsClearDisplayTime,
		config
	)
}

// !np start response
const handleStart = (
	channel,
	client,
	reportData,
	obs,
	obsClearDisplayTime,
	config,
	tags
) => {
	const firstTrackPlayed = reportData.track_log[0]
	const message = `${tags.username} kicked off this stream with ${firstTrackPlayed.trackId}`
	client.say(channel, message)
	updateOBSWithText(
		obs,
		`${tags.username} kicked off this stream with :\n${firstTrackPlayed.trackId}`,
		obsClearDisplayTime,
		config
	)
}

// !np vibecheck response
const handleVibeCheck = (
	channel,
	client,
	reportData,
	obs,
	obsClearDisplayTime,
	config,
	tags
) => {
	const vibeCheckSelection = vibeCheckSelector(reportData.track_log)
	const { hours, minutes, seconds } = parseTimeString(
		vibeCheckSelection.timeSincePlayed
	)
	if (hours > 0) {
		if (hours > 1) {
			const message = `${tags.username} played "${vibeCheckSelection.trackId}" ${hours} hours & ${minutes} minutes ago in this stream.`
			client.say(channel, message)
			updateOBSWithText(
				obs,
				`vibecheck:\n\n${tags.username} played\n"${vibeCheckSelection.trackId}"\n${hours} hours & ${minutes} minutes ago in this stream.`,
				obsClearDisplayTime,
				config
			)
		} else {
			const message = `${tags.username} played "${vibeCheckSelection.trackId}" ${hours} hour & ${minutes} minutes ago in this stream.`
			client.say(channel, message)
			updateOBSWithText(
				obs,
				`vibecheck:\n\n${tags.username} played\n"${vibeCheckSelection.trackId}"\n${hours} hour & ${minutes} minutes ago in this stream.`,
				obsClearDisplayTime,
				config
			)
		}
	} else {
		const message = `${tags.username} played "${vibeCheckSelection.trackId}" ${minutes} minutes ago in this stream.`
		client.say(channel, message)
		updateOBSWithText(
			obs,
			`vibe check:\n\n${tags.username} played\n"${vibeCheckSelection.trackId}"\n${minutes} minutes ago in this stream.`,
			obsClearDisplayTime,
			config
		)
	}
}

const COMMAND_MAP = {
	undefined: handleDefault,
	previous: handlePrevious,
	start: handleStart,
	vibecheck: handleVibeCheck,
	options: handleOptions,
}

const npCommands = async (channel, tags, args, client, obs, url, config) => {
	const obsClearDisplayTime = config.obsClearDisplayTime	
	try {
		const reportData = await createLiveReport(url)
		if (reportData === undefined) {
			client.say(channel, NO_LIVE_DATA_MESSAGE)
			return
		}

		const handler = COMMAND_MAP[args[0]]
		if (handler) {
			handler(
				channel,
				client,
				reportData,
				obs,
				obsClearDisplayTime,
				config,
				tags
			)
		} else {
			client.say(channel, NP_OPTIONS)
		}
	} catch (error) {
		console.log(error)
		client.say(channel, ERROR_MESSAGE)
	}
}

module.exports = {
	npCommands,
}
