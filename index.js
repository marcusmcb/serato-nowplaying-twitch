// node dependencies
const tmi = require('tmi.js')
const dotenv = require('dotenv')

dotenv.config()

const commandList = require('./command-list/commandList')
const obs = require('./obs/obsConnection')

let userCommandHistory = {}
const COMMAND_REPEAT_LIMIT = 5

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

try {
	client.connect()
} catch (error) {
	console.log(error)
}

client.on('message', (channel, tags, message, self) => {
  console.log('MESSAGE: ', message)
  if (self || !message.startsWith('!')) {
    return
  }

  const args = message.slice(1).split(' ')
  const command = args.shift().toLowerCase()

  if (command in commandList) {
    if (!userCommandHistory[tags.username]) {
      userCommandHistory[tags.username] = [];
    }

    let history = userCommandHistory[tags.username];

    if (history.length >= COMMAND_REPEAT_LIMIT && history.every(hist => hist === command)) {
      client.say(channel, `@${tags.username}, try a different command before using that one again.`);
    } else {
      commandList[command](channel, tags, args, client, obs);
      history.push(command);

      if (history.length > COMMAND_REPEAT_LIMIT) {
        history.shift();  // Remove the oldest command
      }
    }
  }
})

