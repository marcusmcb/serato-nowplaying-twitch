const axios = require('axios')

const exchangeCodeForToken = async (code) => {
	const params = new URLSearchParams()
	params.append('client_id', `${process.env.TWITCH_CLIENT_ID}`)
	params.append('client_secret', `${process.env.TWITCH_CLIENT_SECRET}`)
	params.append('code', code)
	params.append('grant_type', 'authorization_code')
	params.append('redirect_uri', `${process.env.TWITCH_AUTH_REDIRECT_URL}`)

	const response = await axios.post(`${process.env.TWITCH_AUTH_URL}`, params)
	return response.data // Contains access token and refresh token
}

const getRefreshToken = async (refreshToken) => {
	const params = new URLSearchParams()
	params.append('client_id', `${process.env.TWITCH_CLIENT_ID}`)
	params.append('client_secret', `${process.env.TWITCH_CLIENT_SECRET}`)
	params.append('grant_type', 'refresh_token')
	params.append('refresh_token', refreshToken)

	const response = await axios.post(`${process.env.TWITCH_AUTH_URL}`, params)
	return response.data // Contains access token and refresh token
}

module.exports = { exchangeCodeForToken, getRefreshToken }
