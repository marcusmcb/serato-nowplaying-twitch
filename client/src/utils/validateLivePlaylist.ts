const validateLivePlaylist = async (
	formData: any,
	addMessageToQueue: (message: string) => void,
	setError: (error: string) => void
) => {
	const seratoDisplayName = formData.seratoDisplayName.replaceAll(' ', '_')
	const livePlaylistURL =
		'https://www.serato.com/playlists/' + seratoDisplayName + '/live'
	const response = await window.electron.validateLivePlaylist({ url: livePlaylistURL })
	if (response && response.isValid) {
		addMessageToQueue(
			'Your Serato Live Playlist is public and ready for use with npChatbot.'
		)
	} else if (response && !response.isValid) {
		setError(
			'Your current Serato Live Playlist cannot be reached. Please ensure your playlist is live and public and try again.'
		)
		setTimeout(() => {
			setError('')
		}, 5000)
	} else if (response && response.error) {
		console.error(response.error)
		addMessageToQueue(response.error)
	} else {
		console.error('Unexpected response format from validate-live-playlist')
	}
}

export default validateLivePlaylist
