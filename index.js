const tmi = require('tmi.js')
const Datastore = require('nedb')
const autoCommandsConfig = require('./bot-assets/auto-commands/config/autoCommandsConfig')
const {
	commandList,
	urlCommandList,
} = require('./bot-assets/command-list/commandList')
const { obs, connectToOBS } = require('./obs/obsConnection')
const { decryptCredential } = require('./auth/encryption')
const {
	returnAccessTokenConfig,
	returnRefreshTokenConfig,
} = require('./auth/accessTokenConfig')
const { getRefreshToken, updateUserToken } = require('./auth/createAccessToken')

const initializeBot = async (config) => {
	// const twitchOAuthKey = await decryptCredential(config.encryptedKey)
	let userCommandHistory = {}
	let urlCommandCooldown = false
	const COOLDOWN_DURATION = 5000
	const COMMAND_REPEAT_LIMIT = 5
	const displayOBSMessage = config.isObsResponseEnabled

	// const url = `https://serato.com/playlists/${config.seratoDisplayName}/8-1-2023`
	const url = `https://serato.com/playlists/${config.seratoDisplayName}/live`

	// console.log('--------------------')
	// console.log('CONFIG: ')
	// console.log(config)
	// console.log('--------------------')

	const currentAccessToken = await getRefreshToken(config.twitchRefreshToken)
	
	console.log("CURRENT ACCESS TOKEN: ")
	console.log(currentAccessToken)	
	
	try {
		await updateUserToken(currentAccessToken)
	} catch (error) {
		console.error("Failed to update user token: ", error)
	}

	const accessTokenConfig = returnAccessTokenConfig(config)
	const refreshTokenConfig = returnRefreshTokenConfig(
		config,
		currentAccessToken
	)

	// setTimeout(() => {
	// 	console.log('----------------')
	// 	console.log(refreshTokenConfig)
	// 	console.log('----------------')
	// }, 1000)

	// await method to persist new access and refresh
	// token values to user's NEDB settings

	// set up test stream using serato auto play and
	// live playlist features and see if it retains
	// connection past the token expiration point

	// test command during and after token expiration

	const client = new tmi.Client(refreshTokenConfig)

	try {
		client.connect()
	} catch (error) {
		console.error('TWITCH CONNECTION ERROR: ', error)
	}

	await connectToOBS(config)
	autoCommandsConfig(client, obs, config)

	client.on('message', (channel, tags, message, self) => {
		if (self || !message.startsWith('!')) {
			return
		}

		const args = message.slice(1).split(' ')
		const command = args.shift().toLowerCase()

		if (!userCommandHistory[tags.username]) {
			userCommandHistory[tags.username] = []
		}

		let history = userCommandHistory[tags.username]
		history.push(command)

		if (history.length > COMMAND_REPEAT_LIMIT) {
			history.shift()
		}

		if (command in commandList) {
			if (
				history.length >= COMMAND_REPEAT_LIMIT &&
				history.every((hist) => hist === command)
			) {
				client.say(
					channel,
					`@${tags.username}, try a different command before using that one again.`
				)
			} else {
				if (command in urlCommandList && displayOBSMessage) {
					if (urlCommandCooldown) {
						client.say(
							channel,
							`@${tags.username}, please wait for the current command on screen to clear before using that one.`
						)
						return
					}
					urlCommandCooldown = true
					commandList[command](channel, tags, args, client, obs, url, config)
					setTimeout(() => {
						urlCommandCooldown = false
					}, COOLDOWN_DURATION)
				} else {
					commandList[command](channel, tags, args, client, obs, url, config)
				}
			}
		}
	})
}

module.exports = initializeBot
