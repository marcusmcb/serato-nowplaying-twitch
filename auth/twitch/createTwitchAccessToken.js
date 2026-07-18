const axios = require('axios')
const db = require('../../database/database')
const logToFile = require('../../scripts/logger')
const WebSocket = require('ws')
const { storeToken, getToken, deleteToken } = require('../../database/helpers/tokens')

const exchangeCodeForToken = async (code) => {
	// mainWindow.webContents.send('auth-code', { exchangeCodeForToken: code })
	logToFile(`exchangeCodeForToken called with code: ${code}`)

	const params = new URLSearchParams()
	params.append('client_id', `${process.env.TWITCH_CLIENT_ID}`)
	params.append('client_secret', `${process.env.TWITCH_CLIENT_SECRET}`)
	params.append('code', code)
	params.append('grant_type', 'authorization_code')
	params.append('redirect_uri', `${process.env.TWITCH_AUTH_REDIRECT_URL}`)
	logToFile(`client_id: ${JSON.stringify(process.env.TWITCH_CLIENT_ID)}`)
	logToFile(
		`client_secret: ${JSON.stringify(process.env.TWITCH_CLIENT_SECRET)}`
	)
	logToFile(`code: ${JSON.stringify(code)}`)
	logToFile(
		`redirect_uri: ${JSON.stringify(process.env.TWITCH_AUTH_REDIRECT_URL)}`
	)
	logToFile(`* * * * * * * * * * * * * * * * * * *`)

	try {
		const response = await axios.post(`${process.env.TWITCH_AUTH_URL}`, params)
		if (response.data) {
			// mainWindow.webContents.send('auth-code', {
			// 	exchanged_token: response.data,
			// })
			logToFile(`Token exchange successful: ${JSON.stringify(response.data)}`)
			logToFile(`* * * * * * * * * * * * * * * * * * *`)
			return response.data
		} else {
			// mainWindow.webContents.send('auth-code', { foo_error: response })
			logToFile(`Token exchange error: ${JSON.stringify(response)}`)
			logToFile(`* * * * * * * * * * * * * * * * * * *`)
		}
	} catch (error) {
		console.error('Error exchanging code for token:', error)
		logToFile(`* * * * * * * * * * * * * * * * * * *`)
		// mainWindow.webContents.send('auth-code', { exchange_token_error: error })
		logToFile(`Error exchanging code for token: ${error}`)
		logToFile(`* * * * * * * * * * * * * * * * * * *`)
	}
}

const initTwitchAuthToken = async (code, wss, mainWindow) => {
	// mainWindow.webContents.send('auth-code', { initTwitchAuthToken: code })
	try {
		const token = await exchangeCodeForToken(code)
		if (token) {
			logToFile(
				`exchangeCodeForToken result successful: ${JSON.stringify(token)}`
			)
			logToFile(`* * * * * * * * * * * * * * * * * * *`)
		} else {
			logToFile(`exchangeCodeForToken result error: ${JSON.stringify(token)}`)
			logToFile(`* * * * * * * * * * * * * * * * * * *`)
			// add return statement here and logic to notify user
			// in the client UI that the token exchange failed
			// and to try again or contact support
		}

		// Resolve current user (if any) using promises so we can use await cleanly
		const user = await new Promise((resolve, reject) =>
			db.users.findOne({}, (err, doc) => (err ? reject(err) : resolve(doc)))
		)

	if (user) {
			console.log('User found: ', user)
			logToFile(`User found: ${JSON.stringify(user)}`)
			logToFile(`* * * * * * * * * * * * * * * * * * *`)
			// store token securely in OS keystore and mark authorized in DB
			try {
				await storeToken('twitch', user._id, token)
				// If this user's tokens haven't been migrated yet, mark them as authorized
				// in the DB so older versions of the app (or users without keystore
				// entries) will still see the authorized flag. If the user has already
				// been migrated (user._tokensMigrated?.twitch), skip updating the DB.
				if (!user._tokensMigrated || !user._tokensMigrated.twitch) {
					await new Promise((resolve, reject) =>
						db.users.update({ _id: user._id }, { $set: { isTwitchAuthorized: true } }, {}, (err) => (err ? reject(err) : resolve(true)))
					)
				}
			} catch (e) {
				const msg = e && e.message ? e.message : String(e)
				logToFile(`Error storing twitch token in keystore: ${msg}`)
				console.error('Error storing twitch token in keystore:', msg)
			}
		} else {
			// insert new user doc and store token in keystore
			// create a user record but DO NOT persist sensitive tokens in DB
			const newDoc = await new Promise((resolve, reject) =>
				db.users.insert({}, (err, doc) => (err ? reject(err) : resolve(doc)))
			)
			// notify renderer immediately (without tokens)
			mainWindow.webContents.send('auth-successful', { _id: newDoc._id })

			// store token securely in OS keystore under the new user id and set authorized flag
			try {
				await storeToken('twitch', newDoc._id, token)
				await new Promise((resolve, reject) =>
					db.users.update({ _id: newDoc._id }, { $set: { isTwitchAuthorized: true } }, {}, (err) => (err ? reject(err) : resolve(true)))
				)
			} catch (e) {
				const msg = e && e.message ? e.message : String(e)
				logToFile(`Error storing twitch token in keystore (insert): ${msg}`)
				console.error('Error storing twitch token in keystore (insert):', msg)
			}
		}
		wss.clients.forEach((client) => {
			if (client.readyState === WebSocket.OPEN) {
				client.send('npChatbot successfully linked to your Twitch account')
			}
		})
	} catch (error) {
		console.error('Error exchanging code for token:', error)
		wss.clients.forEach((client) => {
			if (client.readyState === WebSocket.OPEN) {
				client.send(`Error during authorization 01: ${error}`)
			}
		})
	}
}

const getTwitchRefreshToken = async (refreshToken) => {
	const params = new URLSearchParams()
	params.append('client_id', `${process.env.TWITCH_CLIENT_ID}`)
	params.append('client_secret', `${process.env.TWITCH_CLIENT_SECRET}`)
	params.append('grant_type', 'refresh_token')
	params.append('refresh_token', refreshToken)

	try {
		const response = await axios.post(`${process.env.TWITCH_AUTH_URL}`, params)
		logToFile(`REFRESH TOKEN DATA: ${JSON.stringify(response.data)}`)
		// console.log('TOKEN DATA: ')
		// console.log(response.data)
		console.log('Twitch Auth Token Returned')
		// console.log(response.data)
		console.log('--------------------------------------')
		return response.data
	} catch (error) {
		logToFile(`TWITCH REFRESH TOKEN ERROR: ${error.response.data}`)
		console.log('TWITCH REFRESH TOKEN ERROR: ', error.response.data)
		return error.response.data
	}
}

const updateUserToken = async (db, event, token) => {
	const safeReply = (channel, payload) => {
		try {
			if (event && typeof event.reply === 'function') {
				event.reply(channel, payload)
			}
		} catch (e) {
			// no-op: invoke-based IPC events do not support event.reply
		}
	}

	safeReply('botProcessResponse', '*** Update user token called ***')
	try {
		// Resolve current user using promises so we can use await cleanly
		const user = await new Promise((resolve, reject) =>
			db.users.findOne({}, (err, doc) => (err ? reject(err) : resolve(doc)))
		)

		if (!user) {
			logToFile('No user found for token update')
			return { success: false, error: 'No user found' }
		}

		logToFile(`USER FOUND FOR TOKEN UPDATE: ${JSON.stringify(user)}`)

		try {
			// Do NOT persist raw access tokens to the DB. Store in OS keystore instead.
			const existingBlob = await getToken('twitch', user._id).catch(() => null)
			await storeToken('twitch', user._id, {
				...(existingBlob || {}),
				access_token: token.access_token,
				refreshed_at: Date.now(),
			})

			// Fetch the updated user data (non-sensitive) to notify renderer
			const userDoc = await new Promise((resolve, reject) =>
				db.users.findOne({ _id: user._id }, (err, doc) => (err ? reject(err) : resolve(doc)))
			)

			if (userDoc) {
				logToFile(`USER DATA AFTER TOKEN UPDATE: ${JSON.stringify(userDoc)}`)
				logToFile('*******************************')
				// sanitize before sending to renderer
				const sanitized = {
					_id: userDoc._id,
					twitchChannelName: userDoc.twitchChannelName || '',
					twitchChatbotName: userDoc.twitchChatbotName || '',
					seratoDisplayName: userDoc.seratoDisplayName || '',
					isObsResponseEnabled: !!userDoc.isObsResponseEnabled,
					isIntervalEnabled: !!userDoc.isIntervalEnabled,
					isSpotifyEnabled: !!userDoc.isSpotifyEnabled,
				}
				safeReply('userDataUpdated', sanitized)
				return {
					success: true,
					message: 'User token successfully updated',
					data: sanitized,
				}
			}
		} catch (error) {
			logToFile(`ERROR UPDATING TOKEN: ${JSON.stringify(error)}`)
			logToFile('*******************************')
			console.log('ERROR UPDATING TOKEN: ', error)
			return { success: false, error }
		}
	} catch (error) {
		logToFile(`ERROR UPDATING TOKEN: ${JSON.stringify(error)}`)
		logToFile('*******************************')
		console.error('Error updating the user token:', error)
		return { success: false, error: 'Error updating user token' }
	}
}

module.exports = {
	exchangeCodeForToken,
	getTwitchRefreshToken,
	updateUserToken,
	initTwitchAuthToken,
}
