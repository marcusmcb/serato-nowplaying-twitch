const WebSocket = require('ws')

const {
	cleanCurrentSongInfo,
	cleanQueryString,
} = require('../spotify/helpers/spotifyPlaylistHelpers')

const {
	getEnabledPlaylistProviders,
} = require('../playlist-providers/providerRegistry')

const {
	getSeratoPlaylistData,
} = require('../spotify/helpers/spotifyPlaylistHelpers')

const createLiveReport = require('../commands/create-serato-report/createLiveReport')

const {
	getUniqueSongs,
	hasSongBeenPlayed,
	checkCurrentSong,
	checkCurrentSongWithPrevious,
} = require('./helpers/autoIdHelpers')

const trackLogStore = require('./trackLogStore')

let { setCurrentPlaylistSummary } = require('../command-use/commandUse')

/* GLOBAL VALUES */

let trackingInterval = null
// Only used to avoid adding true duplicates to provider playlists.
// Kept per-provider so future services do not interfere with one another.
let songsPlayedByProvider = {}
let hasSeededSongsPlayedForContinuedPlaylistByProvider = {}
// Remember the last Serato scrape state so we don't
// repeatedly count the same back-to-back double on
// every polling interval.
let lastSeratoCurrent = null
let lastSeratoPrevious = null

const sendAutoIdMessage = (
	twitchClient,
	channel,
	liveCurrent,
	isAutoIDDelayEnabled,
	autoIDDelaySeconds
) => {
	const delaySeconds = Number(autoIDDelaySeconds || 0)

	if (isAutoIDDelayEnabled === true && delaySeconds > 0) {
		setTimeout(() => {
			twitchClient.say(channel, `Now playing: ${liveCurrent}`)
		}, delaySeconds * 1000)
		return
	}

	twitchClient.say(channel, `Now playing: ${liveCurrent}`)
}

const ensureProviderState = (providerId) => {
	if (!songsPlayedByProvider[providerId]) songsPlayedByProvider[providerId] = []
	if (!hasSeededSongsPlayedForContinuedPlaylistByProvider[providerId]) {
		hasSeededSongsPlayedForContinuedPlaylistByProvider[providerId] = false
	}
}

const prepSongForProviderPlaylist = async (provider, playlistId, currentSong, wss) => {
	ensureProviderState(provider.id)

	let refs = []
	let trackRef = null
	const songQuery = cleanCurrentSongInfo(currentSong)
	const providerQuery = cleanQueryString(songQuery)
	const playedSongs = getUniqueSongs(songsPlayedByProvider[provider.id])
	const doNotAdd = hasSongBeenPlayed(providerQuery, playedSongs) // returns false if the song has NOT been played

	if (doNotAdd) {
		console.log('Song has already been played.')
		return
	}

	trackRef = await provider.searchTrackRef(providerQuery)
	refs.push(trackRef)

	if (trackRef !== null) {
		await provider.addTracksToPlaylist(playlistId, refs, wss)
	}
}

// method to resume updating the user's last Spotify playlist
// based on their Serato Live Playlist
const seedProviderPlayedSongsFromSerato = (providerId, results) => {
	ensureProviderState(providerId)
	for (let i = 0; i < results.length; i++) {
		const songQuery = cleanCurrentSongInfo(results[i].children[0].data.trim())
		const query = cleanQueryString(songQuery)
		songsPlayedByProvider[providerId].push(query)
	}
}

const syncProviderPlaylistFromSerato = async (
	provider,
	playlistId,
	url,
	isAutoIDCleanupEnabled,
	wss,
	{
		mode, // 'init' | 'resume'
	}
) => {
	ensureProviderState(provider.id)

	const results = await getSeratoPlaylistData(url)
	seedProviderPlayedSongsFromSerato(provider.id, results)

	const seratoPlaylistLength = results.length
	const providerPlaylistLength = await provider.getPlaylistLength(playlistId)

	console.log('Serato Playlist Length: ', seratoPlaylistLength)
	console.log(`${provider.id} Playlist Length: `, providerPlaylistLength)

	// INIT: add everything from Serato scrape
	if (mode === 'init') {
		if (!results || results.length === 0) {
			console.log('No songs found in Serato Live Playlist scrape.')
			console.log('Check that your Serato Live Playlist is active and public.')
			console.log('--------------------')
			return
		}

		let trackRefs = []
		for (let i = 0; i < results.length; i++) {
			const songQuery = cleanCurrentSongInfo(results[i].children[0].data.trim())
			const query = cleanQueryString(songQuery)
			const ref = await provider.searchTrackRef(query)
			if (ref !== null) trackRefs.push(ref)
		}
		if (trackRefs.length > 0) {
			trackRefs = [...new Set(trackRefs)]
			setTimeout(async () => {
				await provider.addTracksToPlaylist(playlistId, trackRefs, wss)
			}, 1000)
			// Preserve prior behavior: compute but do not otherwise use currentSong.
			let currentSong = results[0].children[0].data.trim()
			if (isAutoIDCleanupEnabled === true) {
				currentSong = cleanCurrentSongInfo(currentSong)
			}
			console.log('Serato Playlist Length: ', results.length)
		} else {
			console.log('No matching track refs found for songs in Serato Live Playlist.')
			console.log('--------------------')
		}
		return
	}

	// RESUME: compare playlist lengths and add the missing front segment
	if (providerPlaylistLength === seratoPlaylistLength) {
		if (providerPlaylistLength === 0 && seratoPlaylistLength === 0) {
			console.log('No songs found in either playlist.')
			console.log('--------------------')
			return
		}
		console.log(`${provider.id} playlist is up to date with Serato playlist.`)
		console.log('--------------------')
		let currentSong = results[0].children[0].data.trim()
		if (isAutoIDCleanupEnabled === true) {
			currentSong = cleanCurrentSongInfo(currentSong)
		}
		return
	}

	console.log('Serato Playlist Length: ', seratoPlaylistLength)
	console.log(`${provider.id} Playlist Length: `, providerPlaylistLength)
	console.log('--------------------')
	console.log(`Songs in Serato Playlist but not in ${provider.id} Playlist:`)
	console.log('--------------------')

	let trackRefs = []
	const lengthDifference = seratoPlaylistLength - providerPlaylistLength
	for (let i = 0; i < lengthDifference; i++) {
		console.log(results[i].children[0].data.trim())
		const songQuery = cleanCurrentSongInfo(results[i].children[0].data.trim())
		const query = cleanQueryString(songQuery)
		const ref = await provider.searchTrackRef(query)
		if (ref !== null) trackRefs.push(ref)
	}
	if (trackRefs.length > 0) {
		trackRefs = [...new Set(trackRefs)]
		setTimeout(async () => {
			await provider.addTracksToPlaylist(playlistId, trackRefs, wss)
		}, 1000)
		let currentSong = results[0].children[0].data.trim()
		if (isAutoIDCleanupEnabled === true) {
			currentSong = cleanCurrentSongInfo(currentSong)
		}
	} else {
		console.log('No matching track refs found for songs in Serato Live Playlist.')
		console.log('--------------------')
	}
}

// (Spotify implementation was historically embedded here; now handled via provider adapter)

const trackCurrentSongPlaying = async (config, url, twitchClient, wss) => {
	const channel = `#${config.twitchChannelName}`
	const isSpotifyEnabled = config.isSpotifyEnabled
	const isAutoIDEnabled = config.isAutoIDEnabled
	const isAutoIDCleanupEnabled = config.isAutoIDCleanupEnabled
	const isAutoIDDelayEnabled = config.isAutoIDDelayEnabled
	const autoIDDelaySeconds = Number(config.autoIDDelaySeconds || 0)
	const spotifyPlaylistId = config.currentSpotifyPlaylistId
	const continueLastPlaylist = config.continueLastPlaylist

	const enabledProviders = getEnabledPlaylistProviders(config)

	// once the user's playlist is live and public,
	// load the tracks found into the user's enabled provider playlist(s)

	if (!trackLogStore.getCurrentSong()) {
		if (enabledProviders.length > 0) {
			// add played songs to current session summary
			const reportData = await createLiveReport(url)
			setCurrentPlaylistSummary(reportData)

			for (const provider of enabledProviders) {
				const playlistId = provider.getPlaylistId(config)
				if (!playlistId) continue

				if (continueLastPlaylist === true) {
					console.log(`Continuing last ${provider.id} playlist...`)
					console.log('--------------------')
					await syncProviderPlaylistFromSerato(
						provider,
						playlistId,
						url,
						isAutoIDCleanupEnabled,
						wss,
						{ mode: 'resume' }
					)
				} else {
					console.log(`Initializing new ${provider.id} playlist...`)
					console.log('--------------------')
					await syncProviderPlaylistFromSerato(
						provider,
						playlistId,
						url,
						isAutoIDCleanupEnabled,
						wss,
						{ mode: 'init' }
					)
				}
			}
		}

		// Seed historical tracks so mid-set starts are represented.
		await trackLogStore.seedFromLiveReport(url, isAutoIDCleanupEnabled)

		// Immediately publish a live-report snapshot from the seeded
		// track log so commands like !np and !np previous see the
		// correct ordering before the first live song change.
		const initialLiveReport = trackLogStore.getLiveReportSnapshot()
		setCurrentPlaylistSummary(initialLiveReport)

		// Initialize songsPlayed from the seeded track log so we don't
		// re-add those songs to provider playlists, but continue to add new ones.
		// For continued playlists, only seed once per app run so that
		// reconnects don't double-count history.
		if (enabledProviders.length > 0) {
			for (const provider of enabledProviders) {
				ensureProviderState(provider.id)
				const alreadySeededForProvider =
					!!hasSeededSongsPlayedForContinuedPlaylistByProvider[provider.id]

				if (!continueLastPlaylist || !alreadySeededForProvider) {
					const seededLog = trackLogStore.getCurrentTracklog()
					const seededPlayed = seededLog.map((entry) => {
						const songId = isAutoIDCleanupEnabled
							? cleanCurrentSongInfo(entry.track_id)
							: entry.track_id
						return cleanQueryString(songId)
					})
					songsPlayedByProvider[provider.id] = [
						...new Set([
							...songsPlayedByProvider[provider.id],
							...seededPlayed,
						]),
					]
					if (continueLastPlaylist) {
						hasSeededSongsPlayedForContinuedPlaylistByProvider[provider.id] = true
					}
				}
			}
		}

		setTimeout(() => {
			twitchClient.say(
				channel,
				'npChatbot is now tracking the current song playing.'
			)
		}, 3000)
	}

	trackingInterval = setInterval(async () => {
		// Use both the current and previous entries from the
		// Serato Live playlist so we can detect back-to-back
		// doubles even when the track title does not change
		// between polls.
		const { current, previous } = await checkCurrentSongWithPrevious(url)
		const rawCurrentSong = current

		if (rawCurrentSong === null) {
			console.log(
				'No song currently playing.  Please check that your Serato Live Playlist is active and public.'
			)
			// Reset last Serato state so the next real song
			// change is treated as fresh.
			lastSeratoCurrent = null
			lastSeratoPrevious = null
			wss.clients.forEach((client) => {
				if (client.readyState === WebSocket.OPEN) {
					client.send(
						'npChatbot could not detect a song currently playing.  Please ensure your Serato Live Playlist is active and public.'
					)
				}
			})
			return
		}
		// Use a cleaned version only for comparisons and downstream
		// matching/Spotify logic; always log the raw Serato title so
		// full_track_id retains remix/extra detail for !np/!np previous.
		const cleanedCurrentSong = isAutoIDCleanupEnabled
			? cleanCurrentSongInfo(rawCurrentSong)
			: rawCurrentSong

		const lastLogged = trackLogStore.getCurrentSong()
		// Detect a potential back-to-back double from Serato
		// (current and previous rows resolve to the same title),
		// but only treat it as a *new* double when the Serato
		// pair changes so we don't keep appending duplicates on
		// every poll while the playlist is static.
		const isDoubleCandidate =
			cleanedCurrentSong &&
			previous &&
			(isAutoIDCleanupEnabled ? cleanCurrentSongInfo(previous) : previous) ===
				cleanedCurrentSong &&
			lastLogged === cleanedCurrentSong
		const sameSeratoPairAsLast =
			current === lastSeratoCurrent && previous === lastSeratoPrevious
		const songChanged = cleanedCurrentSong !== lastLogged
		const shouldLogDouble = isDoubleCandidate && !sameSeratoPairAsLast

		if (songChanged || shouldLogDouble) {
			console.log('---------------------------')
			console.log('Current Song: ', lastLogged)
			console.log('New Current Song: ', cleanedCurrentSong)
			if (isDoubleCandidate) {
				console.log(
					'Detected potential live doubles (same track back-to-back).'
				)
			}
			console.log('---------------------------')

			// update central track log store for this song change
			trackLogStore.handleSongChange(rawCurrentSong, isAutoIDCleanupEnabled)

			console.log('---------------------------')
			console.log('Current Tracklog:')
			console.log(trackLogStore.getCurrentTracklog())
			console.log('---------------------------')

			// Build a live report snapshot from the current track log so
			// commands can respond using our in-memory data instead of
			// scraping Serato each time.
			const liveReport = trackLogStore.getLiveReportSnapshot()
			setCurrentPlaylistSummary(liveReport)

			// return the current song playing if the Auto ID feature is enabled
			if (isAutoIDEnabled === true) {
				const liveCurrent = trackLogStore.getCurrentSong()
				sendAutoIdMessage(
					twitchClient,
					channel,
					liveCurrent,
					isAutoIDDelayEnabled,
					autoIDDelaySeconds
				)
			}
			// update the user's Spotify playlist with the current song playing
			if (enabledProviders.length > 0) {
				const liveCurrent = trackLogStore.getCurrentSong()
				for (const provider of enabledProviders) {
					const playlistId = provider.getPlaylistId(config)
					if (!playlistId) continue
					await prepSongForProviderPlaylist(provider, playlistId, liveCurrent, wss)
				}
			}
		}

		// Remember the last Serato current/previous pair for
		// the next polling iteration so we can suppress
		// re-counting the same double over and over.
		lastSeratoCurrent = current
		lastSeratoPrevious = previous
	}, 10000)
}

const endTrackCurrentSongPlaying = () => {
	if (trackingInterval) {
		clearInterval(trackingInterval)
		trackingInterval = null
		trackLogStore.reset()
		hasSeededSongsPlayedForContinuedPlaylistByProvider = {}
		songsPlayedByProvider = {}
		lastSeratoCurrent = null
		lastSeratoPrevious = null
		console.log('Auto ID tracking interval successfully ended.')
		console.log('--------------------------------------')
	}
}

module.exports = {
	sendAutoIdMessage,
	trackCurrentSongPlaying,
	endTrackCurrentSongPlaying,
}
