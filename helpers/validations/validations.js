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
		const pattern = new RegExp(
			`<meta[^>]*content=["']twitch\\.tv/${twitchDisplayName}["'][^>]*>`,
			'i'
		)		
		// Use the regex to test the page content
		const exists = pattern.test(pageContent)
		if (exists) {
			console.log("*** TRUE ***")
		}
		// If the pattern is found, we can assume the channel exists
		return exists
	} catch (error) {
		console.error('Error checking Twitch channel by content:', error)
		return false
	}
}

const obsCredentialsCheck = async (
	obsWebsocketAddress,
	obsWebsocketPassword
) => {}

module.exports = {
	seratoURLValidityCheck: seratoURLValidityCheck,
	twitchURLValidityCheck: twitchURLValidityCheck,
	obsCredentialsCheck: obsCredentialsCheck,
}
