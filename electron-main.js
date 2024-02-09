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
const { exchangeCodeForToken } = require('./auth/createAccessToken')

const dotenv = require('dotenv')
dotenv.config()

// Express server setup
const server = express()
const PORT = process.env.PORT || 5000
server.use(bodyParser.json())
server.use(cors())

// Database setup
const db = require('./database')

let mainWindow
let botProcess
let serverInstance
const isDev = true // Set based on your environment

// Express routes
server.get('/', (req, res) => {
	res.send('NPChatbot is up and running')
})

server.get('/auth/twitch/callback', async (req, res) => {
	const { code, state } = req.query

	if (code) {
		// *** TEST ***

		// add initial setup logic to check for user.db file
		// if present, update it with code from Twitch response
		// else, create it and add as appAuthorizationCode

		// add logic/method to refresh token when needed
		// during streaming session

		// research the ability to set token duration when issued
		// on chatbot connection

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
				// console.log('***********************')
				// console.log('User information:', user)
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
	// Encrypt the OAuthKey if it's provided and has changed
	// let encryptedOAuthKey = ''
	// if (req.body.twitchOAuthKey) {
	// 	encryptedOAuthKey = await encryptCredential(req.body.twitchOAuthKey)
	// }

	db.users.findOne({}, async (err, existingUser) => {
		if (err) {
			console.error('Error fetching the user:', err)
			return res.status(500).send('Database error.')
		}

		// If there's an existing user, update only the changed fields
		if (existingUser) {
			const updatedUser = { ...existingUser }

			// Iterate over the keys in the request body to update only changed values
			Object.keys(req.body).forEach((key) => {
				if (req.body[key] !== existingUser[key]) {
					updatedUser[key] = req.body[key]
				}
			})

			// Special handling for the twitchOAuthKey to use the encrypted version
			// if (req.body.twitchOAuthKey) {
			// 	updatedUser.twitchOAuthKey = encryptedOAuthKey
			// }

			await db.users.update(
				{ _id: existingUser._id },
				{ $set: updatedUser },
				{},
				(err, numReplaced) => {
					if (err) {
						console.error('Error updating the user:', err)
						return res.status(500).send('Database error during update.')
					}
					console.log(`Updated ${numReplaced} user(s) with new data.`)
					res.send(updatedUser)
				}
			)
		} else {
			// If there's no existing user, insert a new one (or handle as an error)
			console.log(
				'No existing user found. Inserting new user or handling error.'
			)
			// Insert new user logic here, or return an error response
		}
	})
})

// add client logic to disable user preference update
// while bot is connected and active

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
		botProcess = null		
		console.log(`botProcess process closed with code ${code}`)
		res.send()
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
