const handleConnect = async (
	formData: any,
	addMessageToQueue: (message: string) => void,
	setIsBotConnected: (connected: boolean) => void,
	setError: (error: string) => void
) => {
	addMessageToQueue('Connecting to Twitch...')
	console.log('*** sending request to start npChatbot script ***')
	const response = await window.electron.startBotScript({
		twitchChannelName: formData.twitchChannelName,
		obsWebsocketAddress: formData.obsWebsocketAddress
			? formData.obsWebsocketAddress
			: '',
		obsWebsocketPassword: formData.obsWebsocketPassword
			? formData.obsWebsocketPassword
			: '',
		isObsResponseEnabled: formData.isObsResponseEnabled,
		// Do not send refresh tokens from renderer; they are stored securely in the OS keystore.
		isSpotifyEnabled: formData.isSpotifyEnabled,
		continueLastPlaylist: formData.continueLastPlaylist,
		seratoDisplayName: formData.seratoDisplayName,
	})
	console.log('*** start request completed ***')
	if (response && response.success) {
		console.log('--- npChatbot has been successfully started ---')
		addMessageToQueue(response.message)
		setIsBotConnected(true)
	} else if (response && response.error) {
		console.error(response.error)
		addMessageToQueue('')
		setError(response.error)
		setTimeout(() => {
			setError('')
		}, 10000)
		return
	} else {
		console.error(
			'Unexpected response format from start-bot-script when starting npChatbot'
		)
	}
}

export default handleConnect
