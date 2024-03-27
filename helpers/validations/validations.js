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

const obsWebSocketValidityCheck = async (socketAddress) => {
	console.log('SOCKET CHECK: ')
	console.log(socketAddress)
	return new Promise((resolve, reject) => {
		const ws = new WebSocket(socketAddress)
		ws.on('open', function open() {
			console.log('OBS connection established')
			ws.send('{"request-type": "GetVersion", "message-id": "test"}')
		})
		ws.on('message', function message(data) {
			console.log('Received response: ', data)
			ws.close()
			const response = {
				success: true,
				message: 'OBS websocket connection established.'
			}
			resolve(response)
		})
		ws.on('error', function error(err) {
			console.log('Connection error: ', err.message)
			const response = {
				success: false,
				message: "Couldn't connect to OBS socket.",
			}
			reject(response)
		})
	})
}

module.exports = {
	seratoURLValidityCheck: seratoURLValidityCheck,
	twitchURLValidityCheck: twitchURLValidityCheck,
	obsWebSocketValidityCheck: obsWebSocketValidityCheck,
}
