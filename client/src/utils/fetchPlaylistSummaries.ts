const fetchPlaylistSummaries = async (): Promise<any> => {
	console.log('*** Fetching Playlist Summaries ***')
	const data = await window.electron.getPlaylistSummaries()
	if (data) {
		console.log('Received playlist summaries data:', data)
		return data
	}

	console.error('No data received for playlist summaries.')
	return null
}

export default fetchPlaylistSummaries
