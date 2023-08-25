// dependencies
const tmi = require('tmi.js')
const dotenv = require('dotenv')

const { commandList, urlCommandList } = require('./command-list/commandList')
const autoCommandsConfig = require('./auto-commands/config/autoCommandsConfig')
const obs = require('./obs/obsConnection')

dotenv.config()

let userCommandHistory = {}
let urlCommandCooldown = false
const COOLDOWN_DURATION = 5000
const COMMAND_REPEAT_LIMIT = 5
const displayOBSMessage =
	process.env.DISPLAY_OBS_MESSAGES.toLowerCase()

// const url = `https://serato.com/playlists/${process.env.SERATO_DISPLAY_NAME}/live`;
// const url = 'https://serato.com/playlists/DJ_Marcus_McBride/npchatbot-test_2'
// const url = 'https://serato.com/playlists/DJ_Marcus_McBride/sunday-twitch-set'
const url = 'https://serato.com/playlists/DJ_Marcus_McBride/8-1-2023'

// create tmi instance
const client = new tmi.Client({
	options: { debug: true },
	connection: {
		secure: true,
		reconnect: true,
	},
	identity: {
		username: process.env.TWITCH_BOT_USERNAME,
		password: process.env.TWITCH_OAUTH_TOKEN,
	},
	channels: [process.env.TWITCH_CHANNEL_NAME],
})

// add code to attempt reconnect if client.connect fails
try {
	client.connect()
} catch (error) {
	console.log(error)
}

// call config for automated bot messages
// user can set auto commands status in .env credentials
autoCommandsConfig(client, obs)

// chat command listener
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
			// Check for cooldown only for urlCommandList commands
			// Check for cooldown only for urlCommandList commands and if displayOBSMessage is true
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

				// Clear the cooldown after the duration
				setTimeout(() => {
					urlCommandCooldown = false
				}, COOLDOWN_DURATION)
			} else {
				commandList[command](channel, tags, args, client, obs, url)
				history.push(command)
			}

			if (history.length > COMMAND_REPEAT_LIMIT) {
				history.shift() // Remove the oldest command
			}
		}
	}
})
