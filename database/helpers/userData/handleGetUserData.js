// utility ipcMain method to return the user's data
// to the client UI

const fs = require('fs')
const db = require('../../database')

const handleGetUserData = async () => {
	console.log('Handle Get User Data called')
	console.log('-------------------------------')
	if (fs.existsSync(db.users.filename)) {
		try {
			const user = await new Promise((resolve, reject) => {
				db.users.findOne({}, (err, user) => {
					if (err) {
						reject(err)
					} else {
						resolve(user)
					}
				})
			})

			if (user) {
				console.log('User data retrieved')
				console.log('-------------------------------')
				// Do not expose raw tokens or sensitive fields to the renderer.
				const userDataToSubmit = {
					// copy safe fields only; fall back to empty/defaults where appropriate
					_id: user._id,
					twitchChannelName: user.twitchChannelName || '',
					twitchChatbotName: user.twitchChatbotName || '',
					seratoDisplayName: user.seratoDisplayName || '',
					isObsResponseEnabled: !!user.isObsResponseEnabled,
					isIntervalEnabled: !!user.isIntervalEnabled,
					isSpotifyEnabled: !!user.isSpotifyEnabled,
					continueLastPlaylist: !!user.continueLastPlaylist,
					isAutoIDEnabled: !!user.isAutoIDEnabled,
					isAutoIDCleanupEnabled: !!user.isAutoIDCleanupEnabled,
					isAutoIDDelayEnabled: !!user.isAutoIDDelayEnabled,
					autoIDDelaySeconds: String(user.autoIDDelaySeconds ?? ''),
					isReportEnabled: !!user.isReportEnabled,
					intervalMessageDuration: String(user.intervalMessageDuration ?? ''),
					obsClearDisplayTime: String(user.obsClearDisplayTime ?? ''),
					// OBS connection details are optional but, when provided,
					// should be persisted and hydrated back into the UI so the
					// user does not need to re-enter them each launch.
					obsWebsocketAddress: user.obsWebsocketAddress || '',
					obsWebsocketPassword: user.obsWebsocketPassword || '',
					userEmailAddress: user.userEmailAddress || '',
					// Do expose non-sensitive discord webhook metadata if present
					discord: user.discord
						? {
								webhook_url: user.discord.webhook_url || null,
								channel_id: user.discord.channel_id || null,
								guild_id: user.discord.guild_id || null,
								webhook_id: user.discord.webhook_id || null,
						  }
						: null,
				}

				// Authorization flags:
				// - In development (not packaged), avoid hitting Keychain to prevent repeated prompts.
				//   Use DB-cached flags set during auth flows.
				// - In production (packaged), if flags are missing in DB, initialize them once by
				//   inspecting the keystore and persist the booleans for future reads.
				
				const isPackaged = !!process.resourcesPath
				let isTwitchAuthorized = !!user.isTwitchAuthorized
				let isSpotifyAuthorized = !!user.isSpotifyAuthorized

				if (
					isPackaged &&
					(typeof user.isTwitchAuthorized === 'undefined' ||
						typeof user.isSpotifyAuthorized === 'undefined')
				) {
					try {
						const { getToken } = require('../../helpers/tokens')
						if (typeof user.isTwitchAuthorized === 'undefined') {
							const twitchBlob = await getToken('twitch', user._id).catch(
								() => null
							)
							isTwitchAuthorized = !!(
								twitchBlob &&
								(twitchBlob.refresh_token || twitchBlob.access_token)
							)
							// Persist for future reads
							await new Promise((resolve, reject) =>
								db.users.update(
									{ _id: user._id },
									{ $set: { isTwitchAuthorized } },
									{},
									(err) => (err ? reject(err) : resolve(true))
								)
							)
						}
						if (typeof user.isSpotifyAuthorized === 'undefined') {
							const spotifyBlob = await getToken('spotify', user._id).catch(
								() => null
							)
							isSpotifyAuthorized = !!(
								spotifyBlob &&
								(spotifyBlob.refresh_token || spotifyBlob.access_token)
							)
							// Persist for future reads
							await new Promise((resolve, reject) =>
								db.users.update(
									{ _id: user._id },
									{ $set: { isSpotifyAuthorized } },
									{},
									(err) => (err ? reject(err) : resolve(true))
								)
							)
						}
					} catch (_) {
						// If any error, fall back to false without blocking
					}
				}

				userDataToSubmit.isTwitchAuthorized = !!isTwitchAuthorized
				userDataToSubmit.isSpotifyAuthorized = !!isSpotifyAuthorized

				const responseObject = {
					success: true,
					data: userDataToSubmit,
				}

				return responseObject
			} else {
				console.log('No user found in database.')
				const errorObject = {
					success: false,
					error: 'No user found',
				}
				return errorObject
			}
		} catch (error) {
			console.error('Error fetching user data:', error)
			const errorObject = {
				success: false,
				error: 'Error fetching user data',
			}
			return errorObject
		}
	} else {
		const errorObject = {
			success: false,
			error: 'No user data was found.',
		}
		return errorObject
	}
}

module.exports = {
	handleGetUserData,
}
