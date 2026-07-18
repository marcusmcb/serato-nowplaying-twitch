const {
	getTwitchRefreshToken,
	updateUserToken,
} = require('../auth/twitch/createTwitchAccessToken')
const {
	getEnabledPlaylistProviders,
} = require('../bot-assets/playlist-providers/providerRegistry')

const logToFile = require('../scripts/logger')
const errorHandler = require('../database/helpers/errorHandler/errorHandler')
const db = require('../database/database')
const getUserData = require('../database/helpers/userData/getUserData')
const OBSWebSocket = require('obs-websocket-js').default
const obs = new OBSWebSocket()

const handleStartBotScript = async (event, arg) => {
	logToFile('startBotScript CALLED')
	logToFile('*******************************')

	const user = await getUserData(db)

	let errorResponse = {
		success: false,
		error: null,
	}

	// const user = await new Promise((resolve, reject) => {
	// 	db.users.findOne({}, (err, doc) => {
	// 		if (err) reject(err)
	// 		else resolve(doc)
	// 	})
	// })

	try {
		// Retrieve Twitch refresh token using centralized helper (keystore-first, DB fallback)
		const { getRefreshToken } = require('../database/helpers/getRefreshToken')
		const refreshToken = await getRefreshToken('twitch', user)

		const currentAccessToken = await getTwitchRefreshToken(refreshToken)
		if (currentAccessToken.status === 400) {
			const errorResponse = {
				success: false,
				error: errorHandler(currentAccessToken.message),
			}
			return errorResponse
		} else {
			await updateUserToken(db, event, currentAccessToken)
			console.log('User token successfully updated')
			console.log('--------------------------------------')
			logToFile('User token successfully updated')
			logToFile('*******************************')
		}
	} catch (error) {
		console.error('Failed to update user token during start:', error)
		logToFile(`Failed to update user token during start: ${error}`)
		logToFile('*******************************')
		const errorResponse = {
			success: false,
			error: 'Failed to update user token.',
		}
		return errorResponse
	}

	// validate local OBS connection if OBS responses are enabled
	if (arg.isObsResponseEnabled === true) {
		try {
			await obs.connect(
				'ws://' + arg.obsWebsocketAddress,
				arg.obsWebsocketPassword
			)
			await obs.disconnect()
			console.log('OBS websocket test successful')
			console.log('--------------------------------------')
		} catch (error) {
			errorResponse.error = errorHandler(error)
			return errorResponse
		}
	}

	// if Spotify is enabled, get a fresh access token
	const enabledProviders = getEnabledPlaylistProviders(arg)
	if (enabledProviders.length === 0) {
		console.log('No playlist providers are enabled')
		console.log('-------------------------')
		return
	}

	for (const provider of enabledProviders) {
		if (typeof provider.refreshAccessToken === 'function') {
			const tokenResult = await provider.refreshAccessToken()
			if (tokenResult && tokenResult.status === 400) {
				console.log(`${provider.id} access token is invalid`)
				const errorResponse = {
					success: false,
					error: errorHandler('Spotify token is invalid'),
				}
				return errorResponse
			}
		}

		const response = await provider.ensurePlaylistOnBotStart({ arg, user })
		if (response && response.success === false) {
			return response
		}
	}

	return {
		success: true,
	}
}

module.exports = {
	handleStartBotScript,
}
