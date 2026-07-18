const http = require('http')
const { initDiscordAuthToken } = require('./handleDiscordAuth')

/**
 * Starts a lightweight HTTP server to handle Discord OAuth callbacks.
 *
 * Params:
 * - port: number (defaults to 5003)
 * - wss: WebSocket.Server instance used to notify renderer(s)
 * - getMainWindow: () => Electron.BrowserWindow | undefined
 *
 * Returns the created http.Server instance.
 */

const startDiscordCallbackServer = ({
	port = 5003,
	wss,
	getMainWindow,
	isShareNonceValid,
	onSharePlaylist,
	onDeletePlaylist,
}) => {
	if (!wss) {
		throw new Error(
			'startDiscordCallbackServer requires a WebSocket server (wss).'
		)
	}

	const server = http.createServer(async (req, res) => {
		const setCorsHeaders = () => {
			try {
				res.setHeader('Access-Control-Allow-Origin', '*')
				res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
				res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
				res.setHeader('Access-Control-Max-Age', '600')
			} catch {}
		}

		const sendJson = (statusCode, obj) => {
			setCorsHeaders()
			res.writeHead(statusCode, { 'Content-Type': 'application/json' })
			res.end(JSON.stringify(obj))
		}

		const readJsonBody = (limitBytes = 16 * 1024) =>
			new Promise((resolve, reject) => {
				let bytes = 0
				let data = ''
				req.on('data', (chunk) => {
					bytes += chunk.length
					if (bytes > limitBytes) {
						reject(new Error('Payload too large'))
						return
					}
					data += chunk.toString('utf8')
				})
				req.on('end', () => {
					try {
						resolve(data ? JSON.parse(data) : {})
					} catch (e) {
						reject(e)
					}
				})
				req.on('error', reject)
			})

		try {
			if (req.url && req.url.startsWith('/discord/share-playlist')) {
				setCorsHeaders()

				if (req.method === 'OPTIONS') {
					res.writeHead(204)
					res.end()
					return
				}

				if (req.method !== 'POST') {
					sendJson(405, { success: false, message: 'Method not allowed.' })
					return
				}

				if (typeof onSharePlaylist !== 'function') {
					sendJson(501, {
						success: false,
						message: 'Discord share is not available.',
					})
					return
				}

				let body = null
				try {
					body = await readJsonBody()
				} catch {
					sendJson(400, { success: false, message: 'Invalid request body.' })
					return
				}

				const nonce = body?.nonce
				if (typeof isShareNonceValid === 'function') {
					const ok = isShareNonceValid(nonce)
					if (ok !== true) {
						sendJson(403, { success: false, message: 'Unauthorized request.' })
						return
					}
				}

				const result = await onSharePlaylist({
					spotifyURL: body?.spotifyURL,
					sessionDate: body?.sessionDate,
					twitchChannelName: body?.twitchChannelName,
				})

				if (result && result.success === true) {
					sendJson(200, { success: true })
					return
				}

				sendJson(400, {
					success: false,
					message: result?.message || 'Failed to share to Discord.',
				})
				return
			}

			if (req.url && req.url.startsWith('/playlists/delete')) {
				setCorsHeaders()

				if (req.method === 'OPTIONS') {
					res.writeHead(204)
					res.end()
					return
				}

				if (req.method !== 'POST') {
					sendJson(405, { success: false, message: 'Method not allowed.' })
					return
				}

				if (typeof onDeletePlaylist !== 'function') {
					sendJson(501, {
						success: false,
						message: 'Delete is not available.',
					})
					return
				}

				let body = null
				try {
					body = await readJsonBody()
				} catch {
					sendJson(400, { success: false, message: 'Invalid request body.' })
					return
				}

				const nonce = body?.nonce
				if (typeof isShareNonceValid === 'function') {
					const ok = isShareNonceValid(nonce)
					if (ok !== true) {
						sendJson(403, { success: false, message: 'Unauthorized request.' })
						return
					}
				}

				const playlistId = body?.playlistId
				if (!playlistId || typeof playlistId !== 'string') {
					sendJson(400, { success: false, message: 'Missing playlistId.' })
					return
				}

				const result = await onDeletePlaylist({ playlistId })
				if (result && result.success === true) {
					sendJson(200, { success: true, numRemoved: result.numRemoved || 0 })
					return
				}

				sendJson(400, {
					success: false,
					message: result?.message || 'Failed to delete playlist.',
				})
				return
			}

			if (req.url && req.url.startsWith('/auth/discord/callback')) {
				const urlObj = new URL(req.url, `http://127.0.0.1:${port}`)
				const code = urlObj.searchParams.get('code')
				const error = urlObj.searchParams.get('error')
				const state = urlObj.searchParams.get('state')

				if (error) {
					console.log('Discord Auth Error:', error)
					res.writeHead(400, { 'Content-Type': 'text/plain' })
					res.end('Discord authorization failed.')
					return
				}

				if (!code) {
					console.log('No authorization code received.')
					res.writeHead(400, { 'Content-Type': 'text/plain' })
					res.end('No authorization code received.')
					return
				}

				if (code) {
					const isAuthSuccessful = await initDiscordAuthToken(
						code,
						wss,
						getMainWindow && getMainWindow()
					)

					if (!isAuthSuccessful) {
						res.writeHead(502, { 'Content-Type': 'text/plain' })
						res.end(
							'Discord authorization failed during token exchange. Please verify app credentials and re-authorize.'
						)
						return
					}

					setTimeout(() => {
						console.log('Discord auth token initialized.')
					}, 100)
				}

				res.writeHead(200, { 'Content-Type': 'text/plain' })
				res.end('Discord authorization successful! You may close this window.')
				return
			}

			res.writeHead(404, { 'Content-Type': 'text/plain' })
			res.end('Not Found')
		} catch (err) {
			console.error('Error in Discord callback handler:', err)
			try {
				res.writeHead(500, { 'Content-Type': 'text/plain' })
				res.end('Internal Server Error')
			} catch {}
		}
	})

	server.listen(port, () => {
		console.log(`Discord auth callback HTTP server running on port ${port}`)
	})

	return server
}

module.exports = {
	startDiscordCallbackServer,
}
