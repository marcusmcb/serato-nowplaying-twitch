const fs = require('fs')
const { spawn } = require('child_process')
const path = require('path')
const bodyParser = require('body-parser')
const cors = require('cors')
const express = require('express')
const { app, BrowserWindow, ipcMain } = require('electron')
const isDev = require('electron-is-dev')
const scriptPath = path.join(__dirname, './boot.js')
const OBSWebSocket = require('obs-websocket-js').default

const { exchangeCodeForToken } = require('./auth/createAccessToken')
const {
	seratoURLValidityCheck,
	twitchURLValidityCheck,
} = require('./helpers/validations/validations')
const {
	updateUserData,
} = require('./helpers/updateUserParams/updateUserParams')

const {
	OBS_AUTH_ERROR,
	OBS_AUTH_FAILURE,
	OBS_TIMEOUT_ERROR,
	OBS_SOCKET_ERROR,
	OBS_DEFAULT_ERROR,
} = require('./bot-assets/constants/constants')

const dotenv = require('dotenv')
dotenv.config()

require('electron-reload')(__dirname, {
	electron: require(`${__dirname}/node_modules/electron`),
})

const server = express()
const PORT = process.env.PORT || 5000
server.use(bodyParser.json())
server.use(cors())

const db = require('./database')

let mainWindow
let botProcess
let serverInstance

const obs = new OBSWebSocket()
// const isDev = true

// Express routes
server.get('/', (req, res) => {
	res.send('NPChatbot is up and running')
})

server.get('/auth/twitch/callback', async (req, res) => {
	const { code, state } = req.query

	if (code) {
		// add initial setup logic to check for user.db file
		// if present, update it with code from Twitch response
		// else, create it and add as appAuthorizationCode

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

ipcMain.on('getUserData', (event, arg) => {
	if (fs.existsSync('users.db')) {
		console.log('users.db exists! Fetching the user information...')
		let preloadPath = path.join(__dirname, './scripts/preload.js')
		db.users.findOne({}, (err, user) => {
			if (err) {
				console.error('Error fetching the user:', err)
			} else if (user) {
				console.log('--------------------')
				console.log('USER: ')
				console.log(user)
				event.reply('getUserDataResponse', {
					success: true,
					data: user,
				})
			} else {
				console.log('users.db does not exist yet')
				// res.status(404).send({ error: 'No user found.' })
				event.reply('getUserDataResponse', {
					success: false,
					error: 'no user found',
				})
			}
		})
	} else {
		console.log('users.db does not exist yet.')
	}
})

// add client logic to disable user preference update
// while bot is connected and active

// Start React client app (dev only)
const startClient = () => {
	if (isDev) {
		console.log('Starting client app...')
		spawn('npm', ['start'], {
			cwd: path.join(__dirname, './client'),
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

// IPC listener for starting the bot script
ipcMain.on('startBotScript', async (event, arg) => {
	console.log('ARGS: ', arg)

	if (arg.isObsResponseEnabled === true) {
		let errorResponse = {
			success: false,
			error: null,
		}
		try {
			await obs.connect(
				'ws://' + arg.obsWebsocketAddress,
				arg.obsWebsocketPassword
			)
			console.log('Connected to OBS properly')
		} catch (error) {
			const errorMessage = error.toString()
			console.error('Failed to connect to OBS: ', errorMessage)
			switch (true) {
				case errorMessage.includes('authentication is required'):
					errorResponse.error = OBS_AUTH_ERROR
					event.reply('startBotResponse', errorResponse)
				case errorMessage.includes('Authentication failed'):
					errorResponse.error = OBS_AUTH_FAILURE
					event.reply('startBotResponse', errorResponse)
				case errorMessage.includes('connect ETIMEDOUT'):
					errorResponse.error = OBS_TIMEOUT_ERROR
					event.reply('startBotResponse', errorResponse)
				case errorMessage.includes('connect ECONNREFUSED'):
					errorResponse.error = OBS_SOCKET_ERROR
					event.reply('startBotResponse', errorResponse)
				default:
					errorResponse.error = OBS_DEFAULT_ERROR
					event.reply('startBotResponse', errorResponse)
			}
			return
		}
	}

	// disable "connect" button in client UI if botProcess is already running
	// test functionality for accuracy and then remove the botProcess check below

	// if user has OBS responses enabled, run validity check that OBS
	// websocket can be reached

	// if not, inform user to check address/password or to disable
	// OBS responses to proceed

	if (botProcess) {
		console.log('Bot is already running.')
		event.reply('startBotResponse', {
			success: false,
			error: 'Bot is already running.',
		})
		return
	}

	botProcess = spawn('node', [scriptPath])

	botProcess.stdout.on('data', (data) => {
		const parsedMessage = data.toString().trim()
		console.log(`--- stdout: DATA ---`)
		console.log(parsedMessage)
		if (
			parsedMessage
				.toLowerCase()
				.includes(`joined #${arg.twitchChannelName.toLowerCase()}`)
		) {
			console.log('--- Twitch Chat Properly Connected ---')
			const botResponse = {
				success: true,
				message: parsedMessage,
			}
			event.reply('startBotResponse', botResponse)
		} else if (parsedMessage.toLowerCase().includes('error')) {
			console.log('--- bot response error ---')
			const botResponse = {
				success: false,
				error: parsedMessage,
			}
			event.reply('startBotResponse', botResponse)
			botProcess = null
		}
	})

	botProcess.stderr.on('data', (data) => {
		if (data.includes('OBSWebSocketError')) {
			console.log('OBS ERROR')
			const botResponse = {
				success: false,
				message:
					'npChatbot could not detect OBS. Please ensure OBS is running.',
			}
			event.reply('botProcessResponse', botResponse)
		}
		console.error(`stderr: IPC --> ${data}`)
	})

	// botProcess.on('close', (code) => {
	// 	console.log(`botProcess process exited with code ${code}`)
	// 	botProcess = null
	// 	// Optionally, notify the renderer process here
	// })
})

ipcMain.on('stopBotScript', async (event, arg) => {
	if (botProcess) {
		botProcess.on('exit', () => {
			console.log('botProcess has exited.')
			botProcess = null
		})

		botProcess.kill()
		event.reply('stopBotResponse', {
			success: true,
			message: 'ipcMain: bot process successfully exited',
		})
	} else {
		event.reply('stopBotResponse', {
			success: false,
			error: 'ipcMain: no bot process running to exit',
		})
	}
})

ipcMain.on('submitUserData', async (event, arg) => {
	// add helper method to check submitted args against
	// stored user preferences
	// if different, run the necessary validations on only
	// the changed fields
	console.log('------------------')
	console.log('SUBMIT USER DATA: ')
	console.log(arg)

	const isValidSeratoURL = await seratoURLValidityCheck(arg.seratoDisplayName)
	const isValidTwitchURL = await twitchURLValidityCheck(arg.twitchChannelName)
	if (isValidTwitchURL && isValidSeratoURL) {
		try {
			const data = await updateUserData(db, event, arg)
			console.log('--- DATA ---', data)
			event.reply('userDataResponse', data) // Directly use the response from updateUserData
		} catch (error) {
			console.error(error)
			event.reply('userDataResponse', error) // Send the error response
		}
	} else {
		console.log('SERATO? ', isValidSeratoURL)
		console.log('TWITCH? ', isValidTwitchURL)
		// Handle invalid URLs
		const errorMessage = isValidTwitchURL
			? 'The Serato profile name given is invalid'
			: 'The Twitch profile name given is invalid'
		event.reply('userDataResponse', { error: errorMessage })
	}
})

// Create the Electron BrowserWindow
const createWindow = () => {
	mainWindow = new BrowserWindow({
		width: 1280,
		height: 680,
		webPreferences: {
			preload: path.join(__dirname, './scripts/preload.js'),
			nodeIntegration: false,
			contextIsolation: true, // Set to true in production
		},
	})

	const appURL = isDev
		? 'http://localhost:3000'
		: `file://${path.join(__dirname, './client/build/index.html')}`
	console.log('Loading URL: ', appURL)
	mainWindow.loadURL(appURL)
	mainWindow.webContents.openDevTools()
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
