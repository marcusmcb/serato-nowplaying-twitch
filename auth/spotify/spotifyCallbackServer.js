const http = require('http')
const { initSpotifyAuthToken } = require('./createSpotifyAccessToken')
const { setSpotifyUserId } = require('./setSpotifyUserId')

/**
 * Starts a lightweight HTTP server to handle Spotify OAuth callbacks.
 *
 * Params:
 * - port: number (defaults to 5001)
 * - wss: WebSocket.Server instance used to notify renderer(s)
 * - getMainWindow: () => Electron.BrowserWindow | undefined
 *
 * Returns the created http.Server instance.
 */

const startSpotifyCallbackServer = ({ port = 5001, wss, getMainWindow }) => {
	if (!wss) {
		throw new Error(
			'startSpotifyCallbackServer requires a WebSocket server (wss).'
		)
	}

	const server = http.createServer(async (req, res) => {
		try {
			if (req.url && req.url.startsWith('/auth/spotify/callback')) {
				const urlObj = new URL(req.url, `http://127.0.0.1:${port}`)
				const code = urlObj.searchParams.get('code')
				const error = urlObj.searchParams.get('error')
				const state = urlObj.searchParams.get('state')

				console.log('Received Spotify auth callback:', { code, error, state })

				if (error) {
					console.error('Spotify Auth Error:', error)
					res.writeHead(400, { 'Content-Type': 'text/plain' })
					res.end('Authorization failed. Please try again.')
					return
				}

				if (!code) {
					console.error('No authorization code received.')
					res.writeHead(400, { 'Content-Type': 'text/plain' })
					res.end('No authorization code received.')
					return
				}

				console.log('Received authorization code:', code)

				if (code) {
					const isAuthSuccessful = await initSpotifyAuthToken(
						code,
						wss,
						getMainWindow && getMainWindow()
					)

					if (!isAuthSuccessful) {
						res.writeHead(502, { 'Content-Type': 'text/plain' })
						res.end(
							'Spotify authorization failed during token exchange. Please verify app credentials and try again.'
						)
						return
					}

					setTimeout(async () => {
						try {
							await setSpotifyUserId()
						} catch (e) {
							console.error('Error setting Spotify user id:', e)
						}
					}, 100)
				}

				const mainWindow = getMainWindow && getMainWindow()
				if (mainWindow && mainWindow.webContents) {
					mainWindow.webContents.send('close-spotify-auth-window')
				}

				res.writeHead(200, { 'Content-Type': 'text/plain' })
				res.end('Authorization successful! You may close this window.')
			} else {
				res.writeHead(404, { 'Content-Type': 'text/plain' })
				res.end('Not Found')
			}
		} catch (err) {
			console.error('Error in Spotify callback handler:', err)
			try {
				res.writeHead(500, { 'Content-Type': 'text/plain' })
				res.end('Internal Server Error')
			} catch {}
		}
	})

	server.listen(port, () => {
		console.log(`Spotify auth callback HTTP server running on port ${port}`)
	})

	return server
}

module.exports = {
	startSpotifyCallbackServer,
}
