const axios = require('axios')
const WebSocket = require('ws')

// helper method to validate Serato live playlist URL
const seratoURLValidityCheck = async (seratoDisplayName) => {
	const url = `https://www.serato.com/playlists/${seratoDisplayName}`
	try {
		const response = await axios.head(url)
		if (response.status >= 200 && response.status < 300) {
			return true
		} else {
			return false
		}
	} catch (error) {
		if (error.response && error.response.status === 404) {
			console.log('Serato URL not found')
			return false
		} else {
			console.log('Error checking Serato URL: ', error.message)
			return false
		}
	}
}

// helper method to validate Twitch URL
const twitchURLValidityCheck = async (twitchDisplayName) => {
	console.log('TWITCH VALIDITY CHECK: ', twitchDisplayName)
	const url = `https://www.twitch.tv/${twitchDisplayName}`
	try {
		const response = await axios.get(url)
		const pageContent = response.data

		// Construct a regex pattern to search for the presence of the expected content attribute
		// This regex accounts for potential variations in how the attribute might be formatted
		const pattern = new RegExp(
			`content=["']twitch\\.tv/${twitchDisplayName}["']`,
			'i'
		)

		// Use the regex to test the page content
		const exists = pattern.test(pageContent)

		// If the pattern is found, we can assume the channel exists
		return exists
	} catch (error) {
		console.error('Error checking Twitch channel by content:', error)
		return false
	}
}

const crypto = require('crypto')

const obsWebSocketValidityCheck = async (socketAddress, password) => {
	console.log('SOCKET CHECK: ')
	console.log(socketAddress)
	console.log(password)
	return new Promise((resolve, reject) => {
		const ws = new WebSocket(socketAddress)

		const generateAuthResponse = (password, salt, challenge) => {
			const secret = crypto
				.createHash('sha256')
				.update(password + salt)
				.digest('base64')
			const authResponse = crypto
				.createHash('sha256')
				.update(secret + challenge)
				.digest('base64')
			return authResponse
		}

		ws.on('open', function open() {
			console.log('OBS connection attempt...')
			ws.send(
				JSON.stringify({
					'request-type': 'GetAuthRequired',
					'message-id': 'authRequiredTest',
				})
			)
		})

		ws.on('message', function message(data) {
			const responseData = JSON.parse(data)
			console.log('Received response: ', responseData)

			if (responseData['message-id'] === 'authRequiredTest') {
				if (responseData.authRequired) {
					const authResponse = generateAuthResponse(
						password,
						responseData.salt,
						responseData.challenge
					)
					ws.send(
						JSON.stringify({
							'request-type': 'Authenticate',
							'message-id': 'authTest',
							auth: authResponse,
						})
					)
				} else {
					ws.close()
					resolve({
						success: true,
						message: 'OBS WebSocket connection established (No Auth Required).',
					})
				}
			} else if (responseData['message-id'] === 'authTest') {
				if (responseData.status === 'ok') {
					ws.close()
					resolve({
						success: true,
						message: 'OBS WebSocket connection established and authenticated.',
					})
				} else {
					ws.close()
					reject({ success: false, message: 'Authentication failed.' })
				}
			}
		})

		ws.on('error', function error(err) {
			console.log('Connection error: ', err.message)
			reject({ success: false, message: "Couldn't connect to OBS socket." })
		})
	})
}

module.exports = {
	seratoURLValidityCheck: seratoURLValidityCheck,
	twitchURLValidityCheck: twitchURLValidityCheck,
	obsWebSocketValidityCheck: obsWebSocketValidityCheck,
}
