const updateUserData = async (db, event, arg) => {
	try {
		const existingUser = await db.users.findOne({})
		if (!existingUser) {
			console.log(
				'No existing user found. Inserting new user or handling error.'
			)
			return { error: 'No existing user found.' }
		}

		// Create a new object with only the necessary properties
		const updatedUser = {
			twitchAccessToken: arg.twitchAccessToken,
			twitchRefreshToken: arg.twitchRefreshToken,
			appAuthorizationCode: arg.appAuthorizationCode,
			twitchChannelName: arg.twitchChannelName,
			twitchChatbotName: arg.twitchChatbotName,
			seratoDisplayName: arg.seratoDisplayName,
			isObsResponseEnabled: arg.isObsResponseEnabled,
			isIntervalEnabled: arg.isIntervalEnabled,
			isReportEnabled: arg.isReportEnabled,
			intervalMessageDuration: arg.intervalMessageDuration,
			obsWebsocketPassword: arg.obsWebsocketPassword,
			obsWebsocketAddress: arg.obsWebsocketAddress,
			obsClearDisplayTime: arg.obsClearDisplayTime,
		}

		// Perform the update operation
		await db.users.update({ _id: existingUser._id }, { $set: updatedUser }, {})

		console.log(`Updated user with new data: ${JSON.stringify(updatedUser)}`)

		// Emit 'userDataUpdated' event after successfully updating the user data
		event.reply('userDataUpdated', updatedUser)

		return {
			success: true,
			message: 'User data successfully updated',
			data: updatedUser,
		}
	} catch (error) {
		console.error('Error updating the user:', error)
		return { success: false, error: 'Error updating user' }
	}
}

module.exports = {
	updateUserData: updateUserData,
}
