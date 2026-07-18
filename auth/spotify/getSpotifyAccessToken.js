const axios = require('axios')
const db = require('../../database/database')
const getUserData = require('../../database/helpers/userData/getUserData')
const { getToken, storeToken } = require('../../database/helpers/tokens')
const logToFile = require('../../scripts/logger')

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

const getSpotifyAccessToken = async () => {
	logToFile('Refreshing Spotify access token...')
	logToFile('-------------------------')
	try {
		const spotifyClientId = normalizeEnvValue(process.env.SPOTIFY_CLIENT_ID)
		const spotifyClientSecret = normalizeEnvValue(
			process.env.SPOTIFY_CLIENT_SECRET
		)

		if (!spotifyClientId || !spotifyClientSecret) {
			throw new Error(
				'Missing Spotify client credentials. Check SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET.'
			)
		}

			  const user = await getUserData(db)
			  if (!user) throw new Error('No user record found')

			  // Centralized helper will prefer keystore and fall back to legacy DB fields.
			  const { getRefreshToken } = require('../../database/helpers/getRefreshToken')
			  const refreshToken = await getRefreshToken('spotify', user)

			  if (!refreshToken) {
				throw new Error('No stored Spotify refresh token found (keytar or DB)')
			  }
		const authHeader = Buffer.from(
			`${spotifyClientId}:${spotifyClientSecret}`
		).toString('base64')

		const data = new URLSearchParams({
			grant_type: 'refresh_token',
			refresh_token: refreshToken,
			client_id: spotifyClientId,
			client_secret: spotifyClientSecret,
		}).toString()

		logToFile('Sending request to Spotify for new access token...')
		logToFile(`${JSON.stringify(data)}`)
		logToFile('-------------------------')

		const response = await axios.post(
			'https://accounts.spotify.com/api/token',
			data,
			{
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
					Authorization: `Basic ${authHeader}`,
				},
			}
		)

		const newAccessToken = response.data.access_token
		const maybeNewRefreshToken = response.data.refresh_token

		logToFile('New Spotify access token:')
		logToFile('-------------------------')
		logToFile(newAccessToken)
		logToFile('-------------------------')
		console.log('New Spotify access token:', newAccessToken)
		console.log('-------------------------')

			// Persist the new access token back into keytar if we have a user id and keytar is available.
			// Do NOT write access tokens into DB.
			if (user && user._id) {
				try {
					// write updated access_token to keystore while preserving any existing blob
					const existing = await getToken('spotify', user._id).catch(() => null)
					await storeToken('spotify', user._id, {
						...(existing || {}),
						access_token: newAccessToken,
						refresh_token:
							maybeNewRefreshToken || existing?.refresh_token || null,
						refreshed_at: Date.now(),
					})
					if (!maybeNewRefreshToken) {
						logToFile(
							'Spotify refresh response did not include refresh_token; preserved existing refresh token.'
						)
					}
				} catch (e) {
					// ignore keytar store errors in this flow
				}
			}

			return newAccessToken
	} catch (error) {
		console.log('Spotify Token Error: ')
		const status = error?.response?.status || 500
		console.log(status)
		console.log('-------------------------')
		if (error?.response?.data?.error === 'invalid_client') {
			logToFile(
				'Spotify refresh failed with invalid_client. Verify SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in .env.'
			)
		}
		logToFile(`Error refreshing Spotify access token: ${JSON.stringify(error)}`)
		logToFile('-------------------------')
		console.error('Error refreshing Spotify access token:', error?.message || error)

		return { status }
	}
}

module.exports = { getSpotifyAccessToken }
