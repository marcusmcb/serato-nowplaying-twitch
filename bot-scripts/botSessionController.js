const BOT_SESSION_STATES = {
	IDLE: 'idle',
	STARTING: 'starting',
	CONNECTED: 'connected',
	STOPPING: 'stopping',
}

const createBotSessionController = ({
	loadConfigurations,
	initializeBot,
	handleStartBotScript,
	handleStopBotScript,
	getCurrentPlaylistSummary,
	createPlaylistSummary,
	addPlaylist,
	getUserData,
	db,
	logToFile,
}) => {
	let state = BOT_SESSION_STATES.IDLE
	let tmiInstance = null
	let isConnected = false

	const start = async (event, arg) => {
		if (state !== BOT_SESSION_STATES.IDLE) {
			return {
				success: false,
				error:
					state === BOT_SESSION_STATES.STARTING
						? 'Bot is already starting. Please wait.'
						: state === BOT_SESSION_STATES.STOPPING
							? 'Bot is stopping. Please wait.'
							: 'Bot is already running.',
			}
		}

		state = BOT_SESSION_STATES.STARTING

		try {
			const validStartResponse = await handleStartBotScript(event, arg)
			if (validStartResponse && validStartResponse.success === false) {
				state = BOT_SESSION_STATES.IDLE
				return validStartResponse
			}

			const config = await loadConfigurations()
			const init = await initializeBot(config)
			if (!init) {
				throw new Error('Failed to initialize Twitch bot client.')
			}

			tmiInstance = init
			isConnected = true
			state = BOT_SESSION_STATES.CONNECTED

			return {
				success: true,
				message: 'npChatbot is connected to your Twitch channel.',
			}
		} catch (err) {
			logToFile(`Error starting bot: ${err}`)
			logToFile('*******************************')
			console.error('Error starting bot:', err)
			tmiInstance = null
			isConnected = false
			state = BOT_SESSION_STATES.IDLE
			return {
				success: false,
				error: 'Failed to start npChatbot. Please try again.',
			}
		}
	}

	const stop = async (arg) => {
		if (state === BOT_SESSION_STATES.IDLE) {
			return {
				success: false,
				error: 'No bot client is currently running.',
			}
		}

		if (state === BOT_SESSION_STATES.STARTING) {
			return {
				success: false,
				error: 'Bot is still starting. Please wait before disconnecting.',
			}
		}

		if (state === BOT_SESSION_STATES.STOPPING) {
			return {
				success: false,
				error: 'Bot is already stopping. Please wait.',
			}
		}

		state = BOT_SESSION_STATES.STOPPING

		try {
			const playlistData = await getCurrentPlaylistSummary()
			console.log('Playlist data: ', playlistData)
			if (playlistData && playlistData.total_tracks_played > 0) {
				const finalPlaylistData = await createPlaylistSummary(playlistData)
				const user = await getUserData(db)
				if (user) {
					if (user.isSpotifyEnabled) {
						finalPlaylistData.spotify_link = user.currentSpotifyPlaylistLink
					} else {
						finalPlaylistData.spotify_link = ''
					}
				}
				await addPlaylist(finalPlaylistData)
			} else {
				console.log('No playlist data found to insert into database.')
			}

			const stopResponse = await handleStopBotScript(arg, tmiInstance)
			if (!stopResponse || stopResponse.success === false) {
				state = BOT_SESSION_STATES.CONNECTED
				return (
					stopResponse || {
						success: false,
						error: 'Failed to stop bot client.',
					}
				)
			}

			console.log('----- STOPPING BOT SCRIPT -----')
			tmiInstance = null
			isConnected = false
			state = BOT_SESSION_STATES.IDLE
			console.log('npChatbot successfully disconnected from Twitch')
			console.log('--------------------------------------')

			return {
				success: true,
				message: 'npChatbot has been disconnected from Twitch.',
			}
		} catch (error) {
			console.error('Failed to stop bot script:', error)
			state = tmiInstance
				? BOT_SESSION_STATES.CONNECTED
				: BOT_SESSION_STATES.IDLE
			return {
				success: false,
				error: 'Failed to stop npChatbot. Please try again.',
			}
		}
	}

	const forceReset = () => {
		tmiInstance = null
		isConnected = false
		state = BOT_SESSION_STATES.IDLE
	}

	return {
		start,
		stop,
		forceReset,
		getIsConnected: () => isConnected,
		getState: () => state,
	}
}

module.exports = {
	createBotSessionController,
	BOT_SESSION_STATES,
}