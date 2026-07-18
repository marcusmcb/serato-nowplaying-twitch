const handleDiscordShare = async (
	setCurrentDiscordMessage: (message: string | null) => void,
	spotifyURL: string,
	sessionDate?: Date
) => {
	console.log('Sharing to Discord...')
	const payload = {
		spotifyURL,
		sessionDate: sessionDate ? sessionDate.toISOString() : null,
	}
	const response = await window.electron.sharePlaylistToDiscord(payload)
	console.log("ipcRender Discord request sent.")
	if (response && response.success) {
		console.log("Successfully shared to Discord:", response)
		setCurrentDiscordMessage('Successfully Shared')
		setTimeout(() => {
			setCurrentDiscordMessage(null)
		}, 5000)
	} else {
		setCurrentDiscordMessage(
			'Failed to share playlist to Discord.  Please re-authorize npChatbot with Discord.'
		)
		setTimeout(() => {
			setCurrentDiscordMessage(null)
		}, 5000)
	}
}

export default handleDiscordShare
