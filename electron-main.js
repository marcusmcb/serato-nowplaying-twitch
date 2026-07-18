const fs = require('fs')
const path = require('path')
const https = require('https')
const crypto = require('crypto')
const { pathToFileURL } = require('url')
const bodyParser = require('body-parser')
const cors = require('cors')
const dotenv = require('dotenv')
const WebSocket = require('ws')
const express = require('express')
const { app, BrowserWindow, ipcMain, shell } = require('electron')
const { createMainWindow } = require('./scripts/createMainWindow')
const { waitForServer } = require('./scripts/waitForServer')

// bot config/initialization, and utility methods
const db = require('./database/database')
const loadConfigurations = require('./config')
const initializeBot = require('./index')
const { handleStartBotScript } = require('./bot-scripts/handleStartBotScript')
const { handleStopBotScript } = require('./bot-scripts/handleStopBotScript')
const {
	createBotSessionController,
} = require('./bot-scripts/botSessionController')
const logToFile = require('./scripts/logger')

// auth handlers and user data methods
const { handleTwitchAuth } = require('./auth/twitch/handleTwitchAuth')
const { handleSpotifyAuth } = require('./auth/spotify/handleSpotifyAuth')
const { getDiscordAuthUrl } = require('./auth/discord/handleDiscordAuth')
const {
	startSpotifyCallbackServer,
} = require('./auth/spotify/spotifyCallbackServer')
const {
	startDiscordCallbackServer,
} = require('./auth/discord/discordCallbackServer')
const {
	handleGetUserData,
} = require('./database/helpers/userData/handleGetUserData')
const {
	handleSubmitUserData,
} = require('./database/helpers/userData/handleSubmitUserData')

// serato live playlist status validation
const {
	validateLivePlaylist,
} = require('./database/helpers/validations/validateLivePlaylist')

// user data handler
const getUserData = require('./database/helpers/userData/getUserData')
const { getToken } = require('./database/helpers/tokens')

/* PLAYLIST HANDLERS */
const { createPlaylistSummary } = require('./bot-assets/summary/createPlaylistSummary')
const { getCurrentPlaylistSummary } = require('./bot-assets/command-use/commandUse')
const {
	getPlaylistSummaries,
} = require('./database/helpers/playlistSummaries/getPlaylistSummaries')
const {
	getPlaylistSummaryData,
} = require('./database/helpers/playlistSummaries/getPlaylistSummaryData')
const {
	repairPlaylistSummaries,
} = require('./database/helpers/playlistSummaries/repairPlaylistSummaries')
const { addPlaylist } = require('./database/helpers/playlists/addPlaylist')
const {
	sharePlaylistToDiscord,
} = require('./database/helpers/playlists/sharePlaylistToDiscord')
const {
	deletePlaylist,
} = require('./database/helpers/playlists/deletePlaylist')

const buildPlaylistSummariesHtml = require('./report-templates/buildPlaylistSummariesHtml')

// check if the app is started by Squirrel.Windows
if (require('electron-squirrel-startup')) app.quit()

// https cert options, used during twitch & spotify auth processes
const options = {
	key: fs.readFileSync(path.join(__dirname, './server.key')),
	cert: fs.readFileSync(path.join(__dirname, './server.cert')),
}

// load environment variables & set path
const envPath = path.join(__dirname, '.env')
dotenv.config({ path: envPath })

// environment variables
let mainWindow
let serverInstance

// One-time nonce(s) used to authorize localhost Discord share requests from the
// generated browser report.
const discordShareNonces = new Map()
const registerDiscordShareNonce = (nonce) => {
	if (!nonce) return
	const now = Date.now()
	discordShareNonces.set(String(nonce), now)
	// prune anything older than 2 hours
	for (const [k, ts] of discordShareNonces.entries()) {
		if (now - ts > 2 * 60 * 60 * 1000) discordShareNonces.delete(k)
	}
}
const isDiscordShareNonceValid = (nonce) => {
	if (!nonce) return false
	const ts = discordShareNonces.get(String(nonce))
	if (!ts) return false
	if (Date.now() - ts > 2 * 60 * 60 * 1000) {
		discordShareNonces.delete(String(nonce))
		return false
	}
	return true
}

// server config and middleware
const server = express()
const PORT = process.env.PORT || 5002
const SPOTIFY_HTTP_PORT = 5001
const DISCORD_HTTP_PORT = 5003
server.use(bodyParser.json())
server.use(cors())

const isDev = !app.isPackaged
process.env.NODE_ENV = isDev ? 'development' : 'production'
// Enable a conservative Keychain fallback on macOS packaged builds
if (process.platform === 'darwin' && app.isPackaged) {
	process.env.KEYCHAIN_ACCOUNT_FALLBACK = 'true'
}

// socket config for auth responses
const wss = new WebSocket.Server({ port: 8080 })

// utility method to start app server
const startServer = () => {
	serverInstance = https.createServer(options, server).listen(PORT, () => {
		console.log(`npChatbot HTTPS server is running on port ${PORT}`)
	})
}

const botSessionController = createBotSessionController({
	loadConfigurations,
	initializeBot,
	handleStartBotScript,
	handleStopBotScript,
	getCurrentPlaylistSummary,
	createPlaylistSummary,
	addPlaylist,
	getUserData,
	db,
	logToFile,
})

// start Discord auth callback server
let discordCallbackServer = null

try {
	discordCallbackServer = startDiscordCallbackServer({
		port: DISCORD_HTTP_PORT,
		wss,
		getMainWindow: () => mainWindow,
		isShareNonceValid: isDiscordShareNonceValid,
		onSharePlaylist: async ({ spotifyURL, sessionDate, twitchChannelName }) => {
			try {
				if (!spotifyURL || typeof spotifyURL !== 'string') {
					return { success: false, message: 'Missing Spotify URL.' }
				}

				const userData = await getUserData(db)
				const effectiveTwitchName =
					typeof twitchChannelName === 'string' && twitchChannelName.trim()
						? twitchChannelName.trim()
						: userData?.twitchChannelName || 'Unknown'

				// use webhook URL from keytar token blob if available, otherwise fall back to legacy DB field
				let webhookURL = null
				try {
					if (userData && userData._id) {
						const discordBlob = await getToken('discord', userData._id)
						webhookURL = discordBlob?.webhook?.url || null
					}
				} catch {
					webhookURL = null
				}
				if (!webhookURL) webhookURL = userData?.discord?.webhook_url || null
				if (!webhookURL) {
					return {
						success: false,
						message:
							'Discord webhook is not configured. Please re-authorize Discord.',
					}
				}

				const ok = await sharePlaylistToDiscord(
					spotifyURL,
					webhookURL,
					effectiveTwitchName,
					sessionDate || null,
				)
				return ok
					? { success: true }
					: {
							success: false,
							message:
								'Failed to share playlist to Discord. Please re-authorize Discord.',
						}
			} catch (e) {
				console.error('Discord share endpoint failed:', e)
				return { success: false, message: 'Internal error sharing to Discord.' }
			}
		},
		onDeletePlaylist: async ({ playlistId }) => {
			try {
				if (!playlistId || typeof playlistId !== 'string') {
					return { success: false, message: 'Missing playlistId.' }
				}

				const result = await deletePlaylist(playlistId)
				return result && result.success === true
					? { success: true, numRemoved: result.numRemoved || 0 }
					: { success: false, message: 'Failed to delete playlist.' }
			} catch (e) {
				console.error('Delete playlist endpoint failed:', e)
				return { success: false, message: 'Internal error deleting playlist.' }
			}
		},
	})
} catch (e) {
	console.error('Failed to start Discord callback server:', e)
}

// start Spotify auth callback server
let spotifyCallbackServer = null

try {
	spotifyCallbackServer = startSpotifyCallbackServer({
		port: SPOTIFY_HTTP_PORT,
		wss,
		getMainWindow: () => mainWindow,
	})
} catch (e) {
	console.error('Failed to start Spotify callback server:', e)
}

server.get('/', (req, res) => {
	res.send('NPChatbot is up and running')
})

ipcMain.on('open-auth-settings', (event, url) => {
	shell.openExternal(url)
})

ipcMain.handle(
	'open-playlist-summaries-in-browser',
	async (_event, payload) => {
		try {
			const playlistSummaries = Array.isArray(payload?.playlistSummaries)
				? payload.playlistSummaries
				: []
			const idxRaw = Number(payload?.currentReportIndex ?? 0)
			const currentReportIndex = Number.isFinite(idxRaw) ? idxRaw : 0
			const isDiscordAuthorized = payload?.isDiscordAuthorized === true
			const twitchChannelName =
				typeof payload?.twitchChannelName === 'string'
					? payload.twitchChannelName
					: ''

			const discordShareNonce = crypto.randomBytes(16).toString('hex')
			registerDiscordShareNonce(discordShareNonce)

			const reportsDir = path.join(app.getPath('userData'), 'reports')
			await fs.promises.mkdir(reportsDir, { recursive: true })

			const filePath = path.join(reportsDir, 'playlist-summaries.html')
			const html = buildPlaylistSummariesHtml({
				playlistSummaries,
				currentReportIndex,
				isDiscordAuthorized,
				twitchChannelName,
				discordShareNonce,
			})
			await fs.promises.writeFile(filePath, html, { encoding: 'utf8' })

			const fileUrl = pathToFileURL(filePath).toString()
			await shell.openExternal(fileUrl)

			return { success: true, fileUrl }
		} catch (e) {
			console.error('Failed to open playlist summaries in browser:', e)
			return { success: false, error: String(e?.message || e) }
		}
	},
)

// Accept logs forwarded from renderer process (preload.logToMain)
ipcMain.on('renderer-log', (_event, message) => {
	try {
		const pretty =
			typeof message === 'object'
				? JSON.stringify(message, null, 2)
				: String(message)
		// Write to file and also to console
		logToFile(`[renderer] ${pretty}`)
		// console.log('[renderer]', pretty)
	} catch (e) {
		console.error('Failed to write renderer log to file', e)
	}
})

ipcMain.handle('get-user-data', async (_event, _arg) => {
	const response = await handleGetUserData()
	return response
})

const invokeLegacyReplyHandler = async (handler, successChannel, ...args) => {
	let responsePayload = null
	const legacyEvent = {
		reply: (channel, payload) => {
			if (channel === successChannel) {
				responsePayload = payload
			}
		},
	}

	const returnValue = await handler(legacyEvent, ...args)
	if (responsePayload !== null) return responsePayload
	return returnValue
}

ipcMain.on('userDataUpdated', () => {
	mainWindow.webContents.send('userDataUpdated')
})

ipcMain.on('open-spotify-link', (event, spotifyUrl) => {
	shell.openExternal(spotifyUrl)
})

ipcMain.on('open-twitch-auth-url', async (event, arg) => {
	handleTwitchAuth(event, arg, mainWindow, wss)
})

ipcMain.handle('delete-selected-playlist', async (_event, playlistId) => {
	try {
		const result = await deletePlaylist(playlistId)
		return result && result.success === true
			? result
			: { success: false, error: 'Failed to delete playlist.' }
	} catch (e) {
		console.error('Failed to delete selected playlist:', e)
		return { success: false, error: String(e?.message || e) }
	}
})

ipcMain.handle('get-playlist-summaries', async (_event, _arg) => {
	try {
		const summaries = await getPlaylistSummaries()
		return Array.isArray(summaries) ? summaries : []
	} catch (e) {
		console.error('Failed to fetch playlist summaries:', e)
		return null
	}
})

ipcMain.handle('submit-user-data', async (_event, arg) => {
	try {
		return await invokeLegacyReplyHandler(
			handleSubmitUserData,
			'userDataResponse',
			arg,
			mainWindow,
		)
	} catch (e) {
		console.error('Failed to submit user data:', e)
		return { success: false, error: String(e?.message || e) }
	}
})

ipcMain.on('open-spotify-auth-url', async (event, arg) => {
	const spotifyRedirectUri = `http://127.0.0.1:5001/auth/spotify/callback/`
	console.log('Spotify Redirect URI: ', spotifyRedirectUri)
	handleSpotifyAuth(event, arg, mainWindow, wss, spotifyRedirectUri)
})

ipcMain.on('open-discord-auth-url', async (event, arg) => {
	const state = 'npchatbot-' + Date.now()
	const discordAuthUrl = getDiscordAuthUrl(state)
	if (!discordAuthUrl) {
		const msg =
			'Discord auth configuration is missing. Set DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, and DISCORD_REDIRECT_URI in .env.'
		console.error(msg)
		try {
			wss.clients.forEach((client) => {
				if (client.readyState === 1) client.send(msg)
			})
		} catch (e) {}
		return
	}
	shell.openExternal(discordAuthUrl)
})

ipcMain.handle('validate-live-playlist', async (_event, arg) => {
	const isValid = await validateLivePlaylist(arg.url)
	return { isValid: isValid }
})

ipcMain.on('update-connection-state', (_event, _state) => {
	// Main process owns authoritative connection state via botSessionController.
	// Keep this channel as a no-op for compatibility with older renderer code.
})

ipcMain.handle('share-playlist-to-discord', async (_event, payload) => {
	const { spotifyURL, sessionDate } = payload || {}
	const userData = await getUserData(db)
	const twitchChannelName = userData?.twitchChannelName
	// use webhook URL from keytar token blob if available, otherwise fall back to legacy DB field
	let webhookURL = null
	try {
		if (userData && userData._id) {
			const discordBlob = await getToken('discord', userData._id)
			webhookURL = discordBlob?.webhook?.url || null
		}
	} catch (e) {
		// keytar may not be available in some environments; fall back to DB
		webhookURL = null
	}
	if (!webhookURL) webhookURL = userData?.discord?.webhook_url || null
	const ok = await sharePlaylistToDiscord(
		spotifyURL,
		webhookURL,
		twitchChannelName,
		sessionDate,
	)
	return ok
		? { success: true }
		: {
				success: false,
				error:
					'Failed to share playlist to Discord. Please re-authorize npChatbot with Discord.',
		  }
})

// ipc handler for the Twitch connection process
ipcMain.handle('start-bot-script', async (event, arg) => {
	return botSessionController.start(event, arg)
})

// ipc handler for the Twitch disconnection process
ipcMain.handle('stop-bot-script', async (_event, arg) => {
	return botSessionController.stop(arg)
})

// create the main application window via helper
const initMainWindow = async () => {
	const preloadPath = path.join(__dirname, './scripts/preload.js')
	const iconPath = path.join(__dirname, './client/public/favicon.ico')
	const appHtmlFilePath = path.join(__dirname, './client/build/index.html')

	// In dev, CRA may auto-select a different port (e.g., 3001) if 3000 is busy.
	// We pin CRA to 3001 in client/package.json, so prefer that by default.
	// We still probe alternates to support overrides and unusual environments.
	let devServerUrl = process.env.REACT_DEV_SERVER_URL || 'http://127.0.0.1:3001'
	if (isDev) {
		const candidates = [
			process.env.REACT_DEV_SERVER_URL,
			'http://127.0.0.1:3001',
			'http://localhost:3001',
			'http://127.0.0.1:3000',
			'http://localhost:3000',
		].filter(Boolean)

		const uniqueCandidates = [...new Set(candidates)]
		// CRA can take a bit to boot; keep probing for up to 60s total.
		const start = Date.now()
		const overallTimeoutMs = 60000
		while (Date.now() - start < overallTimeoutMs) {
			let found = null
			for (const url of uniqueCandidates) {
				try {
					const ok = await waitForServer(url, 1200)
					if (ok) {
						found = url
						break
					}
				} catch (e) {
					// ignore and try next candidate
				}
			}
			if (found) {
				devServerUrl = found
				break
			}
			await new Promise((r) => setTimeout(r, 250))
		}
	}

	mainWindow = await createMainWindow({
		isDev,
		getIsConnected: () => botSessionController.getIsConnected(),
		onForceClose: () => {
			botSessionController.forceReset()
			app.quit()
		},
		preloadPath,
		iconPath,
		waitForServer,
		devServerUrl,
		appHtmlFilePath,
	})
}

// use the async createWindow everywhere
app.on('activate', async () => {
	if (BrowserWindow.getAllWindows().length === 0) {
		await initMainWindow()
	}
})

app.on('ready', async () => {
	startServer()
	// run migration before creating the main window so tokens are migrated on app startup.
	// controlled by env var MIGRATE_ON_STARTUP (default: enabled). Set to 'false' to skip.
	const migrateFlag = process.env.MIGRATE_ON_STARTUP
	if (migrateFlag === undefined || migrateFlag.toLowerCase() !== 'false') {
		try {
			const { migrateAllUsers } = require('./database/helpers/migrateTokens')
			// run migration in the background so it cannot block UI startup. We log completion when it finishes.
			try {
				// default to removing legacy fields on startup migration; set MIGRATE_REMOVE_LEGACY=false to keep legacy values
				const removeLegacy =
					(process.env.MIGRATE_REMOVE_LEGACY || 'true').toLowerCase() === 'true'
				migrateAllUsers({ compact: true, removeLegacy })
					.then((summary) => {
						if (summary) {
							console.log('Startup token migration completed. Summary:')
							console.log(`  usersScanned: ${summary.usersScanned}`)
							console.log(
								`  migrated: spotify=${summary.migrated.spotify}, discord=${summary.migrated.discord}, twitch=${summary.migrated.twitch}`,
							)
							if (summary.errors && summary.errors.length > 0) {
								console.error('  migration errors:')
								console.error(JSON.stringify(summary.errors, null, 2))
							} else {
								console.log('  no migration errors')
							}
						} else {
							console.log('Startup token migration completed with no summary.')
						}
					})
					.catch((e) => console.error('Startup migration failed:', e))
			} catch (e) {
				console.error('Startup migration invocation failed:', e)
			}
		} catch (e) {
			console.error(
				'Migration module not available during startup migration:',
				e,
			)
		}
	} else {
		console.log(
			'MIGRATE_ON_STARTUP is set to false, skipping startup migration.',
		)
	}
	await initMainWindow()
})

app.on('before-quit', () => {
	botSessionController.forceReset()
	if (mainWindow) {
		mainWindow.destroy()
	}
	if (serverInstance) {
		serverInstance.close(() => {
			console.log('Server closed.')
		})
	}
	if (discordCallbackServer) {
		try {
			discordCallbackServer.close(() => {
				console.log('Discord callback server closed.')
			})
		} catch (e) {
			console.error('Error closing Discord callback server:', e)
		}
	}
	if (spotifyCallbackServer) {
		try {
			spotifyCallbackServer.close(() => {
				console.log('Spotify callback server closed.')
			})
		} catch (e) {
			console.error('Error closing Spotify callback server:', e)
		}
	}
})

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit()
	}
})
