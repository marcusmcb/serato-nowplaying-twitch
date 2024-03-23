const updateUserData = async (db, event, arg) => {
	db.users.findOne({}, async (err, existingUser) => {
		if (err) {
			console.error('Error fetching the user:', err)
			event.reply('userDataResponse', { error: 'ipcMain: no user found' })
		}

		// If there's an existing user, update only the changed fields
		if (existingUser) {
			const updatedUser = { ...existingUser }

			// Iterate over the keys in the request body to update only changed values
			Object.keys(arg).forEach((key) => {
				if (arg[key] !== existingUser[key]) {
					updatedUser[key] = arg[key]
				}
			})

			// Special handling for the twitchOAuthKey to use the encrypted version
			// if (req.body.twitchOAuthKey) {
			// 	updatedUser.twitchOAuthKey = encryptedOAuthKey
			// }

			try {
				const numReplaced = await new Promise((resolve, reject) => {
					db.users.update(
						{ _id: existingUser._id },
						{ $set: updatedUser },
						{},
						(err, numReplaced) => {
							if (err) {
								reject(err)
							} else {
								resolve(numReplaced)
							}
						}
					)
				})
				console.log(`Updated ${numReplaced} user(s) with new data.`)
				// event.reply('userDataResponse', {
				// 	success: 'User data successfully updated',
				// })
			} catch (error) {
				console.error('Error updating the user:', error)
				event.reply('userDataResponse', {
					error: 'Error updating user data',
				})
			}
		} else {
			// If there's no existing user, insert a new one (or handle as an error)
			console.log(
				'No existing user found. Inserting new user or handling error.'
			)
			// Insert new user logic here, or return an error response
		}
	})
}

module.exports = {
	updateUserData: updateUserData,
}
