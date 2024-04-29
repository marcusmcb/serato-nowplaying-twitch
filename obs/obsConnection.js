// obs/obsConnection.js
const OBSWebSocket = require('obs-websocket-js').default

const connectToOBS = async (config) => {
	if (config.isObsResponseEnabled === true) {
		try {
			await obs.connect(config.obsWebsocketAddress, config.obsWebsocketPassword)
			console.log('Connected to OBS')
		} catch (error) {
			console.error('Failed to connect to OBS:', error)
			return
		}
	} else {
		return
	}
}

const obs = new OBSWebSocket()

module.exports = { obs, connectToOBS }
