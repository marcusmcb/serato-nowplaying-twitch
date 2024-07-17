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

	try {
		const response = await axios.post(`${process.env.TWITCH_AUTH_URL}`, params)
		console.log('TOKEN DATA: ')
		console.log(response.data)
		return response.data
	} catch (error) {
		console.log('REFRESH TOKEN ERROR: ', error.response.data)
		return error.response.data
	}
}

const updateUserToken = async (db, event, token) => {
	event.reply('botProcessResponse', '*** Update user token called ***')
	try {
		db.users.findOne({}, (err, user) => {
			if (err) {
				console.log('USER LOOKUP FOR TOKEN ERROR: ', err)
			} else if (user) {
				try {
					db.users.update(
						{ _id: user._id },
						{ $set: { twitchAccessToken: token.access_token } },
						{}
					)

					// Fetch the updated user data after updating the token
					db.users.findOne({ _id: user._id }, (err, user) => {
						if (err) {
							console.log('USER LOOKUP ERROR AFTER TOKEN UPDATE: ', err)
						} else if (user) {
							event.reply('userDataUpdated', user)
							return {
								success: true,
								message: 'User token successfully updated',
								data: user,
							}
						}
					})
				} catch (error) {
					console.log('ERROR UPDATING TOKEN: ', error)
				}
			}
		})
	} catch (error) {
		console.error('Error updating the user token:', error)
		return { success: false, error: 'Error updating user token' }
	}
}

// const updateUserToken = async (db, event, token) => {
// 	console.log('TOKEN: ', token)
// 	try {
// 		const user = await db.users.findOne({})

// 		if (!user) {
// 			console.log('No existing user found.')
// 			return { error: 'No existing user found.' }
// 		}

// 		// Update only the twitchAccessToken field
// 		await db.users.update(
// 			{ _id: user._id },
// 			{ $set: { twitchAccessToken: token.access_token } },
// 			{}
// 		)

// 		// Fetch the updated user data after updating the token
// 		const updatedUser = await db.users.findOne({ _id: user._id })

// 		console.log(`Updated user with new token: ${JSON.stringify(updatedUser)}`)

// 		// Emit 'userDataUpdated' event after successfully updating the user data
// 		event.reply('userDataUpdated', updatedUser)

// 		return {
// 			success: true,
// 			message: 'User token successfully updated',
// 			data: updatedUser,
// 		}
// 	} catch (error) {
// 		console.error('Error updating the user token:', error)
// 		return { success: false, error: 'Error updating user token' }
// 	}
// }

module.exports = { exchangeCodeForToken, getRefreshToken, updateUserToken }
