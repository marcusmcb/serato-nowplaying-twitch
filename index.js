const tmi = require('tmi.js')
const { commandList, urlCommandList } = require('./command-list/commandList')
const autoCommandsConfig = require('./auto-commands/config/autoCommandsConfig')
const obs = require('./obs/obsConnection')
const Datastore = require('nedb')

function initializeBot(config) {
	console.log('CONFIG:')
	console.log(config)
	let userCommandHistory = {}
	let urlCommandCooldown = false
	const COOLDOWN_DURATION = 5000
	const COMMAND_REPEAT_LIMIT = 5
	const displayOBSMessage = config.isObsResponseEnabled

	const db = {}
	db.users = new Datastore({ filename: 'users.db', autoload: true })

	const url = 'https://serato.com/playlists/DJ_Marcus_McBride/8-1-2023'

	const client = new tmi.Client({
		options: { debug: true },
		connection: {
			secure: true,
			reconnect: true,
		},
		identity: {
			username: config.twitchChatbotName,
			password: config.twitchOAuthKey,
		},
		channels: [config.twitchChannelName],
	})

	try {
		client.connect()
	} catch (error) {
		console.log(error)
	}

	autoCommandsConfig(client, obs)

	client.on('message', (channel, tags, message, self) => {
		if (self || !message.startsWith('!')) {
			return
		}

		const args = message.slice(1).split(' ')
		const command = args.shift().toLowerCase()

		if (command in commandList) {
			if (!userCommandHistory[tags.username]) {
				userCommandHistory[tags.username] = []
			}

			let history = userCommandHistory[tags.username]

			if (
				history.length >= COMMAND_REPEAT_LIMIT &&
				history.every((hist) => hist === command)
			) {
				client.say(
					channel,
					`@${tags.username}, try a different command before using that one again.`
				)
			} else {
				console.log(displayOBSMessage)
				if (command in urlCommandList && displayOBSMessage) {
					if (urlCommandCooldown) {
						client.say(
							channel,
							`@${tags.username}, please wait for the current command on screen to clear before using that one.`
						)
						return
					}
					urlCommandCooldown = true
					commandList[command](channel, tags, args, client, obs, url)
					history.push(command)
					setTimeout(() => {
						urlCommandCooldown = false
					}, COOLDOWN_DURATION)
				} else {
					commandList[command](channel, tags, args, client, obs, url)
					history.push(command)
				}

				if (history.length > COMMAND_REPEAT_LIMIT) {
					history.shift()
				}
			}
		}
	})
}

module.exports = initializeBot
