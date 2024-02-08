const axios = require('axios')
const Datastore = require('nedb')

const db = require('../database')

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

const updateUserToken = (token) => {
	// Update user data in the database
	db.users.findOne({}, (err, user) => {
		if (err) {
			console.error('Error finding the user:', err)
			return res.status(500).send('Database error.')
		}

		if (user) {
			// Update the existing user
			db.users.update(
				{ _id: user._id },
				{
					$set: {
						twitchAccessToken: token.access_token,
						twitchRefreshToken: token.refresh_token,
					},
				},

				{},
				(err, numReplaced) => {
					if (err) {
						console.error('Error updating the user:', err)
						return ('Error updating the user:', err)						
					}
					console.log(`Updated ${numReplaced} user(s) with new Twitch token.`)
					return (`Updated ${numReplaced} user(s) with new Twitch token.`)
				}
			)
		} else {
			// Handle case where user does not exist
			// This might involve creating a new user or handling it as an error
			console.log('CREATE ACCESS TOKEN: No user found to update.')
			return('CREATE ACCESS TOKEN: No user found to update')
		}
	})
}

module.exports = { exchangeCodeForToken, getRefreshToken, updateUserToken }

// 'no user found to update' is being triggered currently
