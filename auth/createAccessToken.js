const axios = require('axios')
const db = require('../database')
const logToFile = require('../scripts/logger')
const WebSocket = require('ws')

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

const initAuthToken = async (code, wss, mainWindow) => {
	// mainWindow.webContents.send('auth-code', { initAuthToken: code })
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
		}

		db.users.findOne({}, (err, user) => {
			if (err) {
				console.error('Error finding the user:', err)
				logToFile('Error finding the user:', err)
				logToFile(`* * * * * * * * * * * * * * * * * * *`)
				return res.status(500).send('Database error.')
			}

			if (user) {
				console.log('User found: ', user)
				logToFile(`User found: ${JSON.stringify(user)}`)
				logToFile(`* * * * * * * * * * * * * * * * * * *`)
				db.users.update(
					{ _id: user._id },
					{
						$set: {
							twitchAccessToken: token.access_token,
							twitchRefreshToken: token.refresh_token,
							appAuthorizationCode: code,
						},
					},
					{},
					(err, numReplaced) => {
						if (err) {
							console.error('Error updating the user:', err)
							logToFile('Update Error updating the user:', err)
							logToFile(`* * * * * * * * * * * * * * * * * * *`)
							return res.status(500).send('Database error during update.')
						}
						logToFile(
							`Updated ${numReplaced} user(s) with new Twitch app token.`
						)
						logToFile(`* * * * * * * * * * * * * * * * * * *`)
						console.log(
							`Updated ${numReplaced} user(s) with new Twitch app token.`
						)
					}
				)
			} else {
				db.users.insert(
					{
						twitchAccessToken: token.access_token,
						twitchRefreshToken: token.refresh_token,
						appAuthorizationCode: code,
					},
					(err, newDoc) => {
						if (err) {
							console.error('Error creating new user: ', err)
							logToFile('Insert Error creating new user: ', err)
							logToFile(`* * * * * * * * * * * * * * * * * * *`)
							return res.status(500).send('Error adding auth code to user file')
						}
						mainWindow.webContents.send('auth-successful', {
							_id: newDoc._id,
						})
					}
				)
			}
		})
		wss.clients.forEach(function each(client) {
			if (client.readyState === WebSocket.OPEN) {
				client.send('npChatbot successfully linked to your Twitch account')
			}
		})
	} catch (error) {
		console.error('Error exchanging code for token:', error)
		wss.clients.forEach(function each(client) {
			if (client.readyState === WebSocket.OPEN) {
				client.send(`Error during authorization 01: ${error}`)
			}
		})
	}
}

const getRefreshToken = async (refreshToken) => {
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
		console.log('--------------------------------------')
		return response.data
	} catch (error) {
		logToFile(`REFRESH TOKEN ERROR: ${error.response.data}`)
		console.log('REFRESH TOKEN ERROR: ', error.response.data)
		return error.response.data
	}
}

const updateUserToken = async (db, event, token) => {
	event.reply('botProcessResponse', '*** Update user token called ***')
	try {
		db.users.findOne({}, (err, user) => {
			if (err) {
				logToFile(`USER LOOKUP FOR TOKEN ERROR: ${JSON.stringify(err)}`)
				console.log('USER LOOKUP FOR TOKEN ERROR: ', err)
			} else if (user) {
				logToFile(`USER FOUND FOR TOKEN UPDATE: ${JSON.stringify(user)}`)
				try {
					db.users.update(
						{ _id: user._id },
						{ $set: { twitchAccessToken: token.access_token } },
						{}
					)

					// Fetch the updated user data after updating the token
					db.users.findOne({ _id: user._id }, (err, user) => {
						if (err) {
							logToFile(
								`USER LOOKUP ERROR AFTER TOKEN UPDATE: ${JSON.stringify(err)}`
							)
							logToFile("*******************************")
							console.log('USER LOOKUP ERROR AFTER TOKEN UPDATE: ', err)
						} else if (user) {
							logToFile(`USER DATA AFTER TOKEN UPDATE: ${JSON.stringify(user)}`)
							logToFile("*******************************")
							event.reply('userDataUpdated', user)
							return {
								success: true,
								message: 'User token successfully updated',
								data: user,
							}
						}
					})
				} catch (error) {
					logToFile(`ERROR UPDATING TOKEN: ${JSON.stringify(error)}`)
					logToFile("*******************************")
					console.log('ERROR UPDATING TOKEN: ', error)
				}
			}
		})
	} catch (error) {
		logToFile(`ERROR UPDATING TOKEN: ${JSON.stringify(error)}`)
		logToFile("*******************************")
		console.error('Error updating the user token:', error)
		return { success: false, error: 'Error updating user token' }
	}
}

module.exports = {
	exchangeCodeForToken,
	getRefreshToken,
	updateUserToken,
	initAuthToken,
}
