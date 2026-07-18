const axios = require('axios')
const db = require('../../database/database')
const getUserData = require('../../database/helpers/userData/getUserData')
const {
	getSpotifyAccessToken,
} = require('../../auth/spotify/getSpotifyAccessToken')
const { getToken } = require('../../database/helpers/tokens')

const checkSpotifyAccessToken = async () => {
	try {		
		const user = await getUserData(db)
		if (!user) {
			console.error('No user record found.')
			return null
		}

		const tokenBlob = await getToken('spotify', user._id)
		if (!tokenBlob || !tokenBlob.access_token) {
			console.error('No stored access token found in keytar.')
			return null
		}

		let accessToken = tokenBlob.access_token

		// test the current access token with a simple request to Spotify
		try {
			await axios.get('https://api.spotify.com/v1/me', {
				headers: {
					Authorization: `Bearer ${accessToken}`,
					'Content-Type': 'application/json',
				},
			})

			// if successful, return the valid access token
			console.log('Spotify access token is valid.')
			return accessToken
		} catch (error) {
			if (error.response && error.response.status === 401) {
				console.error('Spotify access token expired. Refreshing token...')
				// else, fetch a new access token and update the user's data
				const newAccessToken = await getSpotifyAccessToken()

				if (!newAccessToken) {
					console.error('Failed to refresh access token.')
					return null
				}

				// Persist the refreshed access token to the OS keystore instead of DB
				try {
					const tokenBlob = await getToken('spotify', user._id).catch(() => null)
					await require('../../database/helpers/tokens').storeToken('spotify', user._id, {
						...(tokenBlob || {}),
						access_token: newAccessToken,
						refreshed_at: Date.now(),
					})
				} catch (e) {
					// ignore keystore write errors
				}

				console.log('Spotify access token successfully refreshed.')
				return newAccessToken // ✅ Return the new access token!
			} else {
				console.error(
					'Error verifying Spotify access token:',
					error.response?.data || error.message
				)
				return null
			}
		}
	} catch (error) {
		console.error('Error checking Spotify access token:', error.message)
		return null
	}
}

module.exports = { checkSpotifyAccessToken }
