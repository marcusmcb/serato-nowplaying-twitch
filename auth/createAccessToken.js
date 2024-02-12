const axios = require('axios')
const db = require('../database')

const exchangeCodeForToken = async (code) => {
	const params = new URLSearchParams()
	params.append('client_id', `${process.env.TWITCH_CLIENT_ID}`)
	params.append('client_secret', `${process.env.TWITCH_CLIENT_SECRET}`)
	params.append('code', code)
	params.append('grant_type', 'authorization_code')
	params.append('redirect_uri', `${process.env.TWITCH_AUTH_REDIRECT_URL}`)

	const response = await axios.post(`${process.env.TWITCH_AUTH_URL}`, params)
	return response.data
}

const getRefreshToken = async (refreshToken) => {
	const params = new URLSearchParams()
	params.append('client_id', `${process.env.TWITCH_CLIENT_ID}`)
	params.append('client_secret', `${process.env.TWITCH_CLIENT_SECRET}`)
	params.append('grant_type', 'refresh_token')
	params.append('refresh_token', refreshToken)

	const response = await axios.post(`${process.env.TWITCH_AUTH_URL}`, params)
	return response.data
}

const updateUserToken = (token) => {
	return new Promise((resolve, reject) => {
		db.users.findOne({}, (err, user) => {
			if (err) {
				console.error('Error finding the user:', err)
				reject('Database error.')
				return
			}

			if (user) {
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
							reject('Error updating the user.')
						} else {
							console.log(
								`Updated ${numReplaced} user(s) with new Twitch token.`
							)
							resolve(`Updated ${numReplaced} user(s) with new Twitch token.`)
						}
					}
				)
			} else {
				console.log('CREATE ACCESS TOKEN: No user found to update.')
				resolve('No user found to update')
			}
		})
	})
}

module.exports = { exchangeCodeForToken, getRefreshToken, updateUserToken }
