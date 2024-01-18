const tmi = require('tmi.js')
const Datastore = require('nedb')
const autoCommandsConfig = require('./bot-assets/auto-commands/config/autoCommandsConfig')
const { commandList, urlCommandList } = require('./bot-assets/command-list/commandList')
const { obs, connectToOBS } = require('./obs/obsConnection')
const { decryptCredential } = require('./server/auth/encryption')

const initializeBot = async (config) => {
	console.log("CONFIG ----")
	console.log(config)

	const twitchOAuthKey = await decryptCredential(config.encryptedKey)
	console.log("KEY?????? ", twitchOAuthKey)

	let userCommandHistory = {}
	let urlCommandCooldown = false
	const COOLDOWN_DURATION = 5000
	const COMMAND_REPEAT_LIMIT = 5
	const displayOBSMessage = config.isObsResponseEnabled

	const db = {}
	db.users = new Datastore({ filename: 'users.db', autoload: true })

	// const url = `https://serato.com/playlists/${config.seratoDisplayName}/8-1-2023`
	const url = `https://serato.com/playlists/${config.seratoDisplayName}/live`

	const client = new tmi.Client({
		options: { debug: true },
		connection: {
			secure: true,
			reconnect: true,
		},
		identity: {
			username: config.twitchChatbotName,
			password: twitchOAuthKey,
		},
		channels: [config.twitchChannelName],
	})

	try {
		client.connect()
	} catch (error) {
		console.log(error)
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
