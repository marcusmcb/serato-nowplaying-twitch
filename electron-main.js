const fs = require('fs')
const { spawn } = require('child_process')
const path = require('path')
const bodyParser = require('body-parser')
const cors = require('cors')
const express = require('express')
const {
	app,
	protocol,
	shell,
	globalShortcut,
	BrowserWindow,
	ipcMain,
} = require('electron')
const scriptPath = path.join(__dirname, './boot.js')
const OBSWebSocket = require('obs-websocket-js').default
const dotenv = require('dotenv')
const WebSocket = require('ws')

const isDev = require('electron-is-dev')
// const isDev = false

dotenv.config()

// require('electron-reload')(__dirname, {
// 	electron: require(`${__dirname}/node_modules/electron`),
// 	ignored: /node_modules|[\/\\]\.|users\.db/,
// })

const {
	exchangeCodeForToken,
	getRefreshToken,
	updateUserToken,
} = require('./auth/createAccessToken')

const {
	seratoURLValidityCheck,
	twitchURLValidityCheck,
} = require('./helpers/validations/validations')
const {
	updateUserData,
} = require('./helpers/updateUserParams/updateUserParams')
const errorHandler = require('./helpers/errorHandler/errorHandler')

const {
	INVALID_TWITCH_CHATBOT_URL,
	INVALID_TWITCH_URL,
	INVALID_SERATO_DISPLAY_NAME,
} = require('./bot-assets/constants/constants')

const server = express()
const PORT = process.env.PORT || 5000
server.use(bodyParser.json())
server.use(cors())

const db = require('./database')

let mainWindow
let botProcess
let serverInstance

const obs = new OBSWebSocket()

// socket connection for successful twitch auth
// message to the client UI
const wss = new WebSocket.Server({ port: 8080 })

server.get('/', (req, res) => {
	res.send('NPChatbot is up and running')
})

server.get('/auth/twitch/callback', async (req, res) => {
	const { code, state } = req.query

	if (code) {
		console.log('*********************')
		console.log('AUTH CALLBACK CODE: ')
		console.log(code)
		console.log('*********************')
		try {
			const token = await exchangeCodeForToken(code)
			console.log('*********************')
			console.log('TOKEN: ')
			console.log(token)
			console.log('*********************')

			// Update user data in the database
			db.users.findOne({}, (err, user) => {
				if (err) {
					console.error('Error finding the user:', err)
					return res.status(500).send('Database error.')
				}

				if (user) {
					console.log('*********************')
					console.log('USER: ')
					console.log(user)
					console.log('*********************')
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
								`Updated ${numReplaced} user(s) with new Twitch app token.`
							)
						}
					)
				} else {
					db.users.insert(
						{
							twitchAccessToken: token.access_token,
							twitchRefreshToken: token.refresh_token,
							appAuthorizationCode: code,
						},
						(err, newDoc) => {
							if (err) {
								console.error('Error creating new user: ', err)
								return res
									.status(500)
									.send('Error adding auth code to user file')
							}
							console.log('*********************')
							console.log('User Auth Data Updated: ', newDoc)
							console.log('*********************')
						}
					)
				}
			})
			res.redirect('npchatbot-app://auth/success')
			wss.clients.forEach(function each(client) {
				if (client.readyState === WebSocket.OPEN) {
					client.send('npChatbot successfully linked to your Twitch account')
				}
			})
		} catch (error) {
			console.error('Error exchanging code for token:', error)
			res.status(500).send('Error during authorization.')
		}
	} else {
		res.status(400).send('No code received from Twitch.')
	}
})

ipcMain.on('getUserData', async (event, arg) => {
	console.log('-----------------------------')
	console.log('*** getUserData is called ***')
	if (fs.existsSync('users.db')) {
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
				console.log('*** user data is found ***')
				const responseObject = {
					success: true,
					data: user,
				}
				event.reply('getUserDataResponse', responseObject)
			} else {
				console.log('No user found in the database.')
				event.reply('getUserDataResponse', {
					success: false,
					error: 'No user found',
				})
			}
		} catch (error) {
			console.error('Error fetching user data:', error)
			event.reply('getUserDataResponse', {
				success: false,
				error: 'Error fetching user data',
			})
		}
	} else {
		console.log('users.db was not found.')
		event.reply('getUserDataResponse', {
			success: false,
			error: 'users.db was not found',
		})
	}
})

// Start Express server
const startServer = () => {
	serverInstance = server.listen(PORT, () => {
		console.log(`npChatbot Express server is running on port ${PORT}`)
	})
}

ipcMain.on('open-auth-url', () => {
	shell.openExternal(
		'https://id.twitch.tv/oauth2/authorize?response_type=code&client_id=19evlkrdxmriyliiey2fhhhxd8kkl6&redirect_uri=http://localhost:5000/auth/twitch/callback&scope=chat:read+chat:edit&state=c3ab8aa609ea11e793ae92361f002671'
	)
})

// IPC listener for starting the bot script
ipcMain.on('startBotScript', async (event, arg) => {
	let errorResponse = {
		success: false,
		error: null,
	}
	// validate local OBS connection if OBS responses are enabled
	if (arg.isObsResponseEnabled === true) {
		console.log(arg.obsWebsocketAddress)
		try {
			await obs.connect(
				'ws://' + arg.obsWebsocketAddress,
				arg.obsWebsocketPassword
			)
			console.log('Connected to OBS properly')
			await obs.disconnect()
			console.log('OBS validatiion passed')
			// add logic to remove obs object once it's validated
		} catch (error) {
			errorResponse.error = errorHandler(error)
			event.reply('startBotResponse', errorResponse)
			return
		}
	}

	if (botProcess) {
		console.log('Bot is already running.')
		event.reply('startBotResponse', {
			success: false,
			error: 'Bot is already running.',
		})
		return
	}

	try {
		const currentAccessToken = await getRefreshToken(arg.twitchRefreshToken)
		if (currentAccessToken.status === 400) {
			const errorResponse = {
				success: false,
				error: errorHandler(currentAccessToken.message),
			}
			event.reply('startBotResponse', errorResponse)
			return
		} else {
			console.log('*** await updateUserToken ***')
			await updateUserToken(db, event, currentAccessToken)
			console.log('*** updateUserToken COMPLETE ***')
		}
	} catch (error) {
		console.error('Failed to update user token: ', error)
		const errorResponse = {
			success: false,
			error: 'Failed to update user token.',
		}
		event.reply('startBotResponse', errorResponse)
		return
	}

	console.log('--- loading bot process to spawn ---')
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
				data: arg,
			}
			event.reply('startBotResponse', botResponse)
		} else if (parsedMessage.toLowerCase().includes('error')) {
			console.log('--- startBotResponse error ---')
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
			console.log('*** OBSWebSocketError ***')
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

ipcMain.on('userDataUpdated', () => {
	// Emit an event to notify that the user data has been updated
	mainWindow.webContents.send('userDataUpdated')
})

ipcMain.on('submitUserData', async (event, arg) => {
	console.log('*****************')
	console.log('submitUserData ARGS: ')
	console.log(arg)
	console.log('*****************')
	// Replace white space with underscores in Serato URL string for validation check
	const seratoDisplayName = arg.seratoDisplayName.replaceAll(' ', '_')

	// Perform URL validity checks
	const isValidSeratoURL = await seratoURLValidityCheck(seratoDisplayName)
	const isValidTwitchURL = await twitchURLValidityCheck(arg.twitchChannelName)
	const isValidTwitchChatbotURL = await twitchURLValidityCheck(
		arg.twitchChatbotName
	)

	console.log('isValidSeratoURL: ', isValidSeratoURL)
	console.log('isValidTwitchURL: ', isValidTwitchURL)

	if (isValidTwitchURL && isValidTwitchChatbotURL && isValidSeratoURL) {
		try {
			const data = await updateUserData(db, event, arg)
			console.log('--- await updateUserData complete ---')
			mainWindow.webContents.send('userDataUpdated')
			event.reply('userDataResponse', data)
		} catch (error) {
			console.error('User data update error: ', error)
			event.reply('userDataResponse', error)
		}
	} else if (!isValidTwitchURL) {
		event.reply('userDataResponse', { error: INVALID_TWITCH_URL })
	} else if (!isValidTwitchChatbotURL) {
		event.reply('userDataResponse', { error: INVALID_TWITCH_CHATBOT_URL })
	} else {
		event.reply('userDataResponse', { error: INVALID_SERATO_DISPLAY_NAME })
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
			contextIsolation: true,
		},
	})

	const appURL = isDev
		? 'http://127.0.0.1:3000'
		: `file://${path.join(__dirname, './client/build/index.html')}`
	console.log('Loading URL: ', appURL)
	mainWindow.loadURL(appURL)
	mainWindow.webContents.openDevTools()
}

app.on('ready', () => {
	protocol.registerHttpProtocol('npchatbot-app', (request, callback) => {
		const url = request.url
		mainWindow.webContents.send('auth-successful', url)
	})
	// globalShortcut.register('CommandOrControl+R', () => {
	// 	const { webContents } = mainWindow
	// 	webContents.reload()
	// })
	startServer()
	if (isDev) {
		console.log('dev mode')
	}
	createWindow()
	console.log('npChatbot app has started successfully.')
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
