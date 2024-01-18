const express = require('express')
const { spawn } = require('child_process')
const path = require('path')
const bodyParser = require('body-parser')
const cors = require('cors')
const Datastore = require('nedb')
const fs = require('fs')
const testEncryptionKeys = require('./encryption')

const db = {}
let botProcess

const PORT = process.env.PORT || 5000
const app = express()
const scriptPath = path.join(__dirname, '../boot.js')

app.use(bodyParser.json())
app.use(cors())

db.users = new Datastore({ filename: 'users.db', autoload: true })
// db.preferences = new Datastore({ filename: 'preferences.db', autoload: true })

app.get('/', (req, res) => {
	res.send('NPChatbot is up and running')
})

app.get('/getUserData', (req, res) => {
	if (fs.existsSync('users.db')) {
		console.log('users.db exists! Fetching the user information...')

		db.users.findOne({}, (err, user) => {
			if (err) {
				console.error('Error fetching the user:', err)
			} else if (user) {
				console.log("***********************")
				console.log('User information:', user)
				res.send(user)
			} else {
				console.log('users.db does not exist yet')
				res.status(404).send({ error: 'No user found.' })
			}
		})
	} else {
		console.log('users.db does not exist yet.')
	}
})

app.post('/submitUserData', async (req, res) => {
	// console.log('REQUEST BODY: ')
	// console.log(req.body)

	const user = {
		twitchChannelName: req.body.twitchChannelName,
		twitchChatbotName: req.body.twitchChatbotName,
		twitchOAuthKey: req.body.twitchOAuthKey,
		seratoDisplayName: req.body.seratoDisplayName,
		obsWebsocketAddress: req.body.obsWebsocketAddress,
		obsWebsocketPassword: req.body.obsWebsocketPassword,
		intervalMessageDuration: req.body.intervalMessageDuration,
		obsClearDisplayTime: req.body.obsClearDisplayTime,
		userEmailAddress: req.body.userEmailAddress,
		isObsResponseEnabled: req.body.isObsResponseEnabled,
		isIntervalEnabled: req.body.isIntervalEnabled,
		isReportEnabled: req.body.isReportEnabled,
	}

	testEncryptionKeys(req.body.twitchOAuthKey)

	db.users.remove({}, { multi: true }, (err, numRemoved) => {
		if (err) return res.status(500).send({ error: 'DB error during deletion' })
		db.users.insert(user, (err, newUser) => {
			if (err)
				return res.status(500).send({ error: 'DB error during creation' })
			// console.log(newUser)
			res.json(newUser)
		})
	})
})

app.post('/startBotScript', (req, res) => {
	if (botProcess) {
		return res.send('npChatbot has already been started')
	}
	botProcess = spawn('node', [scriptPath])

	botProcess.stdout.on('data', (data) => {
		console.log(`stdout: ${data}`)
		// add handler/listener for chatroom join confirmation
		if (data.includes('info: Joined #djmarcusmcb')) {
			res.send('--- npChatbot has joined the chat ---')
		}
	})

	botProcess.stderr.on('data', (data) => {
		console.error(`stderr: ${data}`)
	})

	botProcess.on('close', (code) => {
		console.log(`botProcess process exited with code ${code}`)
	})
})

app.post('/stopBotScript', (req, res) => {
	if (botProcess) {
		botProcess.on('exit', () => {
			console.log('botProcess has exited.')
			botProcess = null
		})

		botProcess.kill()
		res.send('Bot process termination requested.')
	} else {
		res.send('No bot process running.')
	}
})

app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`)
})
