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
	
	console.log("-----------------")
	console.log("twitchDisplayName: ", twitchDisplayName)
	console.log("-----------------")

	const url = `https://www.twitch.tv/${twitchDisplayName}`
	try {
		const response = await axios.get(url)
		const pageContent = response.data
		const pattern = new RegExp(
			`content=["']twitch\\.tv/${twitchDisplayName}["']`,
			'i'
		)		
		console.log("pattern: ", pattern)
		console.log("-----------------")
		const exists = pattern.test(pageContent)
		console.log("exists? : ", exists)
		// if the pattern is found, we can assume the channel exists
		// the pattern is not returned with invalid Twitch URL
		if (exists) {		
			console.log("Twitch user page exists.")	
			return true
		} else {
			console.log("Twitch user page does not exist.")
			return false
		}		
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
