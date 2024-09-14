const createLiveReport = require('../liveReport/createLiveReport')
const clearOBSResponse = require('../../../obs/obsHelpers/obsHelpers')
const { shortestTrackCommand } = require('../stats/shortestTrack')
const { longestTrackCommand } = require('../stats/longestTrack')
const { doublesCommand } = require('../stats/doublesPlayed')

const {
	NO_LIVE_DATA_MESSAGE,
	ERROR_MESSAGE,
} = require('../../constants/constants')

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

// !np test response
const handleTest = (channel, client) => {
	client.say(channel, 'npChatbot is properly linked to your Twitch channel.')
}

// !np options response
const handleOptions = (channel, client) => {
	const message =
		'You can find the full npChatbot command list at www.npchatbot.com/commands'
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
	const message = `${config.twitchChannelName} kicked off this stream with ${firstTrackPlayed.trackId}`
	client.say(channel, message)
	updateOBSWithText(
		obs,
		`${config.twitchChannelName} kicked off this stream with :\n${firstTrackPlayed.trackId}`,
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
			const message = `${config.twitchChannelName} played "${vibeCheckSelection.trackId}" ${hours} hours & ${minutes} minutes ago in this stream.`
			client.say(channel, message)
			updateOBSWithText(
				obs,
				`vibecheck:\n\n${config.twitchChannelName} played\n"${vibeCheckSelection.trackId}"\n${hours} hours & ${minutes} minutes ago in this stream.`,
				obsClearDisplayTime,
				config
			)
		} else {
			const message = `${config.twitchChannelName} played "${vibeCheckSelection.trackId}" ${hours} hour & ${minutes} minutes ago in this stream.`
			client.say(channel, message)
			updateOBSWithText(
				obs,
				`vibecheck:\n\n${config.twitchChannelName} played\n"${vibeCheckSelection.trackId}"\n${hours} hour & ${minutes} minutes ago in this stream.`,
				obsClearDisplayTime,
				config
			)
		}
	} else {
		const message = `${config.twitchChannelName} played "${vibeCheckSelection.trackId}" ${minutes} minutes ago in this stream.`
		client.say(channel, message)
		updateOBSWithText(
			obs,
			`vibe check:\n\n${config.twitchChannelName} played\n"${vibeCheckSelection.trackId}"\n${minutes} minutes ago in this stream.`,
			obsClearDisplayTime,
			config
		)
	}
}

// !np shortest response
const handleShortest = (
	channel,
	client,
	reportData,
	obs,
	obsClearDisplayTime,
	config,
	tags
) => {
	shortestTrackCommand(channel, client, reportData, obs, config, tags)
}

// !np longest response
const handleLongest = (
	channel,
	client,
	reportData,
	obs,
	obsClearDisplayTime,
	config,
	tags
) => {
	longestTrackCommand(channel, client, reportData, obs, config, tags)
}

// !np doubles response
const handleDoubles = (
	channel,
	client,
	reportData,
	obs,
	obsClearDisplayTime,
	config,
	tags
) => {
	doublesCommand(channel, client, reportData, obs, config, tags)
}

const COMMAND_MAP = {
	undefined: handleDefault,
	previous: handlePrevious,
	start: handleStart,
	vibecheck: handleVibeCheck,
	options: handleOptions,
	test: handleTest,
	shortest: handleShortest,
	longest: handleLongest,
	doubles: handleDoubles,
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
		console.log('np Command error: ', error)
		client.say(channel, ERROR_MESSAGE)
	}
}

module.exports = {
	npCommands,
}
