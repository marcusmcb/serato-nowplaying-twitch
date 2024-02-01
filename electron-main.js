const fs = require('fs')
const { spawn } = require('child_process')
const path = require('path')
const bodyParser = require('body-parser')
const cors = require('cors')
const express = require('express')
const Datastore = require('nedb')
const { app, BrowserWindow } = require('electron')
const scriptPath = path.join(__dirname, './boot.js')
const { encryptCredential } = require('./auth/encryption')

const dotenv = require('dotenv')
dotenv.config()

// Express server setup
const server = express()
const PORT = process.env.PORT || 5000
server.use(bodyParser.json())
server.use(cors())

// Database setup
const db = {}
db.users = new Datastore({ filename: 'users.db', autoload: true })

let mainWindow
let botProcess
let serverInstance
const isDev = true // Set based on your environment

const axios = require('axios')

const exchangeCodeForToken = async (code) => {
	const params = new URLSearchParams()
	params.append('client_id', `${process.env.TWITCH_CLIENT_ID}`)
	params.append('client_secret', `${process.env.TWITCH_CLIENT_SECRET}`)
	params.append('code', code)
	params.append('grant_type', 'authorization_code')
	params.append('redirect_uri', `${process.env.TWITCH_AUTH_REDIRECT_URL}`)

	const response = await axios.post(`${process.env.TWITCH_AUTH_URL}`, params)
	return response.data // Contains access token and refresh token
}

// Express routes
server.get('/', (req, res) => {
	res.send('NPChatbot is up and running')
})

server.get('/auth/twitch/callback', async (req, res) => {
	const { code, state } = req.query

	if (code) {

		// *** TEST ***
		// see if original auth code, when saved, will generate
		// a valid token on each chatbot session connect

		// add initial setup logic to check for user.db file
		// if present, update it with code from Twitch response
		// else, create it and add as appAuthorizationCode

		// move the token exchange method that follows
		// to the chatbot connection control logic and save
		// the returned token to the user.db file
		
		// add logic/method to refresh token when needed
		// during streaming session

		// research the ability to set token duration when issued
		// on chatbot connection

		// research the validity duration of the code generated
		// when the npChatbot app is originally authorized 
		// by Twitch

		// change scope in client params call (button click)
		// to reset app auth state with Twitch for testing

		try {
			const token = await exchangeCodeForToken(code)
			console.log('Token:', token)

			// Update user data in the database
			db.users.findOne({}, (err, user) => {
				if (err) {
					console.error('Error finding the user:', err)
					return res.status(500).send('Database error.')
				}

				if (user) {
					// Update the existing user
					db.users.update(
						{ _id: user._id },
						{
							$set: {
								twitchAccessToken: token.access_token,
								twitchRefreshToken: token.refresh_token,
								appAuthorizationCode: code,
							},
						},

						{},
						(err, numReplaced) => {
							if (err) {
								console.error('Error updating the user:', err)
								return res.status(500).send('Database error during update.')
							}
							console.log(
								`Updated ${numReplaced} user(s) with new Twitch token.`
							)
						}
					)
				} else {
					// Handle case where user does not exist
					// This might involve creating a new user or handling it as an error
					console.log('No user found to update.')
				}
			})

			res.redirect('http://localhost:3000')
		} catch (error) {
			console.error('Error exchanging code for token:', error)
			res.status(500).send('Error during authorization.')
		}
	} else {
		res.status(400).send('No code received from Twitch.')
	}
})

server.get('/getUserData', (req, res) => {
	if (fs.existsSync('users.db')) {
		console.log('users.db exists! Fetching the user information...')

		db.users.findOne({}, (err, user) => {
			if (err) {
				console.error('Error fetching the user:', err)
			} else if (user) {
				console.log('***********************')
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

server.post('/submitUserData', async (req, res) => {
	const encryptedOAuthKey = await encryptCredential(req.body.twitchOAuthKey)
	console.log('---> ', encryptedOAuthKey)
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
		encryptedKey: encryptedOAuthKey,
	}

	db.users.remove({}, { multi: true }, (err, numRemoved) => {
		if (err) return res.status(500).send({ error: 'DB error during deletion' })
		db.users.insert(user, (err, newUser) => {
			if (err)
				return res.status(500).send({ error: 'DB error during creation' })
			console.log(newUser)
			res.json(newUser)
		})
	})
})

server.post('/startBotScript', (req, res) => {
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

server.post('/stopBotScript', (req, res) => {
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

// Start React client app (dev only)
const startClient = () => {
	if (isDev) {
		console.log('Starting client app...')
		spawn('npm', ['start'], {
			cwd: path.join(__dirname, './client'), // Adjust this path to your client app's directory
			stdio: 'ignore',
			shell: true,
			detached: true,
			windowsHide: true,
		})
	}
}

// Start Express server
const startServer = () => {
	serverInstance = server.listen(PORT, () => {
		console.log(`Server is running on port ${PORT}`)
	})
}

// Create the Electron BrowserWindow
const createWindow = () => {
	mainWindow = new BrowserWindow({
		width: 1280,
		height: 680,
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false, // Set to true in production
		},
	})

	const appURL = isDev
		? 'http://localhost:3000'
		: `file://${path.join(__dirname, './client/build/index.html')}`
	console.log('Loading URL: ', appURL)
	mainWindow.loadURL(appURL)
}

// Electron app event handlers
app.on('ready', () => {
	startServer()
	if (isDev) {
		startClient()
	}
	createWindow()
	console.log('app loaded...')
})

app.on('before-quit', () => {
	if (mainWindow) {
		mainWindow.destroy()
	}
	if (serverInstance) {
		serverInstance.close(() => {
			console.log('Server closed.')
		})
	}
})

app.on('window-all-closed', () => {
	console.log('closing app...')
	if (process.platform !== 'darwin') {
		app.quit()
	}
})

app.on('activate', () => {
	if (BrowserWindow.getAllWindows().length === 0) {
		createWindow()
	}
})
