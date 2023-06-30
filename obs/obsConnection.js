const OBSWebSocket = require('obs-websocket-js').default
const dotenv = require('dotenv')

dotenv.config()

const OBSWebSocketAddress = process.env.OBS_WEBSOCKET_ADDRESS
const OBSWebSocketPassword = process.env.OBS_WEBSOCKET_PASSWORD
const obs = new OBSWebSocket()

const connectToOBS = async () => {
	try {
		await obs.connect(OBSWebSocketAddress, OBSWebSocketPassword)
		console.log('Connected to OBS')
	} catch (error) {
		console.error('Failed to connect to OBS:', error)
	}
}

connectToOBS()

module.exports = obs