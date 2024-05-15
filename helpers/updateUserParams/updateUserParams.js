const updateUserData = async (db, event, arg) => {
	try {
		db.users.findOne({ _id: arg._id }, (err, user) => {
			if (err) {
				console.log('USER LOOKUP ERROR: ', err)
			} else if (user) {
				const updatedUser = {
					_id: arg._id,
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
				try {
					db.users.update({ _id: arg._id }, { $set: updatedUser }, {})
					console.log(
						`Updated user with new data: ${JSON.stringify(updatedUser)}`
					)
					console.log(updatedUser)
					// Emit 'userDataUpdated' event after successfully updating the user data
					event.reply('userDataUpdated', updatedUser)

					return {
						success: true,
						message: 'User data successfully updated',
						data: updatedUser,
					}
				} catch (error) {
					console.log('UPDATE ERROR: ', error)
				}
			}
		})

		// Create a new object with only the necessary properties
	} catch (error) {
		console.error('Error updating the user:', error)
		return { success: false, error: 'Error updating user' }
	}
}

module.exports = {
	updateUserData: updateUserData,
}
