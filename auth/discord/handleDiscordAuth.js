const axios = require('axios')
const querystring = require('querystring')
const db = require('../../database/database')
const WebSocket = require('ws')
const { storeToken } = require('../../database/helpers/tokens')

const normalizeEnvValue = (value) => {
	if (typeof value !== 'string') return ''
	const trimmed = value.trim()
	if (
		(trimmed.startsWith('"') && trimmed.endsWith('"')) ||
		(trimmed.startsWith("'") && trimmed.endsWith("'"))
	) {
		return trimmed.slice(1, -1).trim()
	}
	return trimmed
}

const getDiscordClientId = () => normalizeEnvValue(process.env.DISCORD_CLIENT_ID)
const getDiscordClientSecret = () =>
	normalizeEnvValue(process.env.DISCORD_CLIENT_SECRET)
const getDiscordRedirectUri = () =>
	normalizeEnvValue(process.env.DISCORD_REDIRECT_URI) ||
	'http://localhost:5003/auth/discord/callback'

const getDiscordAuthUrl = (state) => {
	const DISCORD_CLIENT_ID = getDiscordClientId()
	const DISCORD_REDIRECT_URI = getDiscordRedirectUri()
	if (!DISCORD_CLIENT_ID || !DISCORD_REDIRECT_URI) {
		return null
	}
	const params = querystring.stringify({
		client_id: DISCORD_CLIENT_ID,
		redirect_uri: DISCORD_REDIRECT_URI,
		response_type: 'code',
		scope: 'identify guilds webhook.incoming',
		state,
		prompt: 'consent',
	})
	return `https://discord.com/oauth2/authorize?${params}`
}

const exchangeCodeForDiscordToken = async (code) => {
	try {
		const DISCORD_CLIENT_ID = getDiscordClientId()
		const DISCORD_CLIENT_SECRET = getDiscordClientSecret()
		const DISCORD_REDIRECT_URI = getDiscordRedirectUri()

		if (!DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET || !DISCORD_REDIRECT_URI) {
			return {
				error: 'missing_config',
				error_description:
					'Missing DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, or DISCORD_REDIRECT_URI',
			}
		}

		console.log('Discord Token Exchange called.')
		console.log('-------------------------------')
		const params = new URLSearchParams()
		params.append('client_id', DISCORD_CLIENT_ID)
		params.append('client_secret', DISCORD_CLIENT_SECRET)
		params.append('grant_type', 'authorization_code')
		params.append('code', code)
		params.append('redirect_uri', DISCORD_REDIRECT_URI)
		params.append('scope', 'identify guilds webhook.incoming')
		console.log('Discord redirect URI:', DISCORD_REDIRECT_URI)
		console.log('-------------------------------')

		const response = await axios.post(
			'https://discord.com/api/oauth2/token',
			params.toString(),
			{ headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
		)
		return response.data
	} catch (error) {
			console.error('Error exchanging Discord code for token:', error)
			console.log('-------------------------------')
			return error?.response?.data || { error: error.message }
	}
}

const initDiscordAuthToken = async (code, wss, mainWindow) => {
	try {
		console.log('Exchanging Discord code for token...')
		console.log('-------------------------------')
		console.log('Auth Code: ', code)
		console.log('-------------------------------')

		// exchange auth code for token

		// set discordAccessToken, discordRefreshToken
		// and discordAuthorizationCode in users.db

		const tokenData = await exchangeCodeForDiscordToken(code)
		if (tokenData) console.log('Token Data: ', tokenData)
		console.log('-------------------------------')

		if (!tokenData || tokenData.error || !tokenData.access_token) {
			const message = tokenData?.error_description
				? `Discord auth failed: ${tokenData.error_description}`
				: 'Discord auth failed: unable to exchange authorization code for token.'
			console.error(message)
			wss.clients.forEach((client) => {
				if (client.readyState === WebSocket.OPEN) {
					client.send(message)
				}
			})
			return false
		}

		if (!tokenData.webhook || !tokenData.webhook.url) {
			const message =
				'Discord auth failed: webhook was not returned. Re-authorize and select a channel when prompted.'
			console.error(message)
			wss.clients.forEach((client) => {
				if (client.readyState === WebSocket.OPEN) {
					client.send(message)
				}
			})
			return false
		}

			// Persist tokens into OS keystore (keytar) and also update DB metadata/legacy fields
			const findOneAsync = () => new Promise((resolve, reject) => db.users.findOne({}, (err, user) => (err ? reject(err) : resolve(user))))
			const updateAsync = (q, u) => new Promise((resolve, reject) => db.users.update(q, u, { multi: true }, (err, num) => (err ? reject(err) : resolve(num))))
			const insertAsync = (doc) => new Promise((resolve, reject) => db.users.insert(doc, (err, newDoc) => (err ? reject(err) : resolve(newDoc))))

			try {
				const user = await findOneAsync()
				if (user && user._id) {
					// store in keytar
					try {
						await storeToken('discord', user._id, {
							access_token: tokenData.access_token,
							refresh_token: tokenData.refresh_token,
							authorization_code: code,
							webhook: tokenData.webhook,
						})
					} catch (e) {
						console.error('Error storing Discord tokens in keytar:', e)
					}
					// update DB metadata only (no raw tokens)
					await updateAsync({}, { $set: { discord: {
						webhook_url: tokenData.webhook?.url,
						channel_id: tokenData.webhook?.channel_id,
						guild_id: tokenData.webhook?.guild_id,
						webhook_id: tokenData.webhook?.id,
					} } })
					console.log('Discord tokens stored (keytar). DB updated with non-sensitive metadata.')
				} else {
					// no user: create new user with legacy fields, then store in keytar
					// create a new user record without storing raw tokens
					const newDoc = await insertAsync({ discord: {
						webhook_url: tokenData.webhook?.url,
						channel_id: tokenData.webhook?.channel_id,
						guild_id: tokenData.webhook?.guild_id,
						webhook_id: tokenData.webhook?.id,
					} })
					try {
						await storeToken('discord', newDoc._id, {
							access_token: tokenData.access_token,
							refresh_token: tokenData.refresh_token,
							authorization_code: code,
							webhook: tokenData.webhook,
						})
					} catch (e) {
						console.error('Error storing new Discord tokens in keytar:', e)
					}
					console.log('New user created and Discord tokens stored (keystore).')
				}
			} catch (err) {
				console.error('Error persisting Discord tokens:', err)
			}

		wss.clients.forEach((client) => {
			if (client.readyState === WebSocket.OPEN) {
				client.send('npChatbot successfully linked to your Discord channel')
			}
		})

		return true

		// mainWindow.webContents.send('discord-auth-success', tokenData)
	} catch (error) {
		console.error('Error exchanging code for token:', error)
		wss.clients.forEach((client) => {
			if (client.readyState === WebSocket.OPEN) {
				client.send(`Error during Discord auth: ${error}`)
			}
		})
		return false
	}
}

module.exports = {
	getDiscordAuthUrl,
	exchangeCodeForDiscordToken,
	initDiscordAuthToken,
}
