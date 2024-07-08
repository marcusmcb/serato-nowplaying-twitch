const updateUserData = async (db, event, arg) => {
	console.log("UPDATE USER DATA:")
	console.log(arg)
	event.reply('botProcessResponse', '*** Update user data called ***')
	try {
		const user = await new Promise((resolve, reject) => {
			db.users.findOne({ _id: arg._id }, (err, user) => {
				if (err) {
					reject(err)
				} else {
					resolve(user)
				}
			})
		})

		if (!user) {
			throw new Error('User not found')
		}

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

		await new Promise((resolve, reject) => {
			db.users.update(
				{ _id: arg._id },
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
		// console.log("------------------------")
		// console.log("UPDATED USER: ")
		// console.log(updatedUser)
		// console.log("------------------------")
		console.log('--- user data update is complete ---')
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
