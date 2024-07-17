const fs = require('fs')
const path = require('path')
const { spawn } = require('child_process')
const https = require('https')
const bodyParser = require('body-parser')
const cors = require('cors')
const express = require('express')
const axios = require('axios')
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
const { URL } = require('url')

// const isDev = require('electron-is-dev')
const isDev = false

dotenv.config()

// require('electron-reload')(__dirname, {
// 	electron: require(`${__dirname}/node_modules/electron`),
// 	ignored: /node_modules|[\/\\]\.|users\.db/,
// })

const {
	// exchangeCodeForToken,
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

const options = {
	key: fs.readFileSync(path.join(__dirname, './server.key')),
	cert: fs.readFileSync(path.join(__dirname, './server.cert')),
}

const db = require('./database')
const logFilePath = path.join(__dirname, 'auth.log')

let mainWindow
let botProcess
let serverInstance
let authWindow
let authCode

const obs = new OBSWebSocket()

const wss = new WebSocket.Server({ port: 8080 })

// Logging function
const logToFile = (message) => {
	const timestamp = new Date().toISOString()
	const logMessage = `${timestamp} - ${message}\n`
	fs.appendFileSync(logFilePath, logMessage, 'utf8')
}

const envPath = path.join(__dirname, '.env')
logToFile(`Loading .env file from: ${envPath}`)
dotenv.config({ path: envPath })

logToFile(`TWITCH_CLIENT_ID: ${process.env.TWITCH_CLIENT_ID}`)
logToFile(`TWITCH_CLIENT_SECRET: ${process.env.TWITCH_CLIENT_SECRET}`)
logToFile(`TWITCH_AUTH_REDIRECT_URL: ${process.env.TWITCH_AUTH_REDIRECT_URL}`)
logToFile(`TWITCH_AUTH_URL: ${process.env.TWITCH_AUTH_URL}`)

const exchangeCodeForToken = async (code) => {
	mainWindow.webContents.send('auth-code', { exchangeCodeForToken: code })
	logToFile(`exchangeCodeForToken called with code: ${code}`)

	const params = new URLSearchParams()
	params.append('client_id', `${process.env.TWITCH_CLIENT_ID}`)
	params.append('client_secret', `${process.env.TWITCH_CLIENT_SECRET}`)
	params.append('code', code)
	params.append('grant_type', 'authorization_code')
	params.append('redirect_uri', `${process.env.TWITCH_AUTH_REDIRECT_URL}`)
	logToFile(`client_id: ${JSON.stringify(process.env.TWITCH_CLIENT_ID)}`)
	logToFile(
		`client_secret: ${JSON.stringify(process.env.TWITCH_CLIENT_SECRET)}`
	)
	logToFile(`code: ${JSON.stringify(code)}`)
	logToFile(
		`redirect_uri: ${JSON.stringify(process.env.TWITCH_AUTH_REDIRECT_URL)}`
	)

	try {
		const response = await axios.post(`${process.env.TWITCH_AUTH_URL}`, params)
		if (response.data) {
			mainWindow.webContents.send('auth-code', { exchanged_token: response })
			logToFile(`Token exchange successful: ${JSON.stringify(response.data)}`)
			return response.data
		} else {
			mainWindow.webContents.send('auth-code', { foo_error: response })
			logToFile(`Token exchange error: ${JSON.stringify(response)}`)			
		}
	} catch (error) {
		console.error('Error exchanging code for token:', error)
		mainWindow.webContents.send('auth-code', { exchange_token_error: error })
		logToFile(`Error exchanging code for token: ${error}`)
	}
}

const initAuthToken = async (code) => {
	mainWindow.webContents.send('auth-code', { initAuthToken: code })
	try {
		const token = await exchangeCodeForToken(code)
		if (token) {
			logToFile(`exchangeCodeForToken result successful: ${JSON.stringify(token)}`)
		} else {
			logToFile(`exchangeCodeForToken result error: ${JSON.stringify(token)}`)
		}
		

		db.users.findOne({}, (err, user) => {
			if (err) {
				console.error('Error finding the user:', err)
				logToFile('Error finding the user:', err)
				return res.status(500).send('Database error.')
			}

			if (user) {
				logToFile('User found:', user)
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
							logToFile('Update Error updating the user:', err)
							return res.status(500).send('Database error during update.')
						}
						logToFile(`Updated ${numReplaced} user(s) with new Twitch app token.`)
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
							logToFile('Insert Error creating new user: ', err)
							return res.status(500).send('Error adding auth code to user file')
						}
						mainWindow.webContents.send('auth-successful', {
							_id: newDoc._id,
						})
					}
				)
			}
		})
		wss.clients.forEach(function each(client) {
			if (client.readyState === WebSocket.OPEN) {
				client.send('npChatbot successfully linked to your Twitch account')
			}
		})
	} catch (error) {
		console.error('Error exchanging code for token:', error)
		wss.clients.forEach(function each(client) {
			if (client.readyState === WebSocket.OPEN) {
				client.send(`Error during authorization 01: ${error}`)
			}
		})
	}
}

server.get('/', (req, res) => {
	res.send('NPChatbot is up and running')
})

server.get('/auth/twitch/callback', async (req, res) => {
	console.log('This should not be getting logged.')
	const { code, state } = req.query

	if (code) {
		mainWindow.webContents.send('auth-code', { auth_code: code })

		try {
			const token = await exchangeCodeForToken(code)
			mainWindow.webContents.send('auth-code', { exchanged_token: token })

			db.users.findOne({}, (err, user) => {
				if (err) {
					console.error('Error finding the user:', err)
					return res.status(500).send('Database error.')
				}

				if (user) {
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
							mainWindow.webContents.send('auth-successful', {
								_id: newDoc._id,
							})
						}
					)
				}
			})

			res.send('Authorization successful. You can close this window.')
			wss.clients.forEach(function each(client) {
				if (client.readyState === WebSocket.OPEN) {
					client.send('npChatbot successfully linked to your Twitch account')
				}
			})

			if (authWindow) {
				authWindow.close()
			}
		} catch (error) {
			console.error('Error exchanging code for token:', error)
			wss.clients.forEach(function each(client) {
				if (client.readyState === WebSocket.OPEN) {
					client.send(`Error during authorization 01: ${error}`)
				}
			})
			res.status(500).send(`Error during authorization 02: ${error}`)
		}
	} else {
		res.status(400).send('No code received from Twitch.')
	}
})

ipcMain.on('open-auth-url', async (event, arg) => {
	const clientId = '19evlkrdxmriyliiey2fhhhxd8kkl6'
	const redirectUri = 'https://localhost:5000/auth/twitch/callback'
	const authUrl = `https://id.twitch.tv/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=chat:read+chat:edit&state=c3ab8aa609ea11e793ae92361f002671`

	authWindow = new BrowserWindow({
		width: 800,
		height: 600,
		webPreferences: {
			nodeIntegration: false,
			contextIsolation: true,
		},
	})

	authWindow.loadURL(authUrl)

	authWindow.webContents.on('will-navigate', async (event, url) => {
		const urlObj = new URL(url)
		const code = urlObj.searchParams.get('code')
		if (code) {
			console.log('CODE:', code)
			authCode = code
			console.log('AUTHCODE: ', authCode)
			mainWindow.webContents.send('auth-code', { auth_code: code })
			authWindow.close()
		}
	})

	authWindow.on('closed', () => {
		mainWindow.webContents.send('auth-code', { auth_code_on_close: authCode })
		console.log('AUTHCODE ON CLOSE: ', authCode)
		initAuthToken(authCode)
		authWindow = null
	})
})

ipcMain.on('getUserData', async (event, arg) => {
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
				const responseObject = {
					success: true,
					data: user,
				}
				event.reply('getUserDataResponse', responseObject)
			} else {
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
		event.reply('getUserDataResponse', {
			success: false,
			error: 'users.db was not found',
		})
	}
})

// Start HTTPS server
const startServer = () => {
	serverInstance = https.createServer(options, server).listen(PORT, () => {
		console.log(`npChatbot HTTPS server is running on port ${PORT}`)
	})
}

// IPC listener for starting the bot script
ipcMain.on('startBotScript', async (event, arg) => {
	let errorResponse = {
		success: false,
		error: null,
	}

	// validate local OBS connection if OBS responses are enabled
	if (arg.isObsResponseEnabled === true) {
		try {
			await obs.connect(
				'ws://' + arg.obsWebsocketAddress,
				arg.obsWebsocketPassword
			)
			await obs.disconnect()
		} catch (error) {
			errorResponse.error = errorHandler(error)
			event.reply('startBotResponse', errorResponse)
			return
		}
	}

	if (botProcess) {
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
			await updateUserToken(db, event, currentAccessToken)
		}
	} catch (error) {
		const errorResponse = {
			success: false,
			error: 'Failed to update user token.',
		}
		event.reply('startBotResponse', errorResponse)
		return
	}

	botProcess = spawn('node', [scriptPath])

	botProcess.stdout.on('data', (data) => {
		console.log('DATA: ', data.toString())
		const parsedMessage = data.toString().trim()
		if (
			parsedMessage
				.toLowerCase()
				.includes(`joined #${arg.twitchChannelName.toLowerCase()}`)
		) {
			const botResponse = {
				success: true,
				message: parsedMessage,
				data: arg,
			}
			event.reply('startBotResponse', botResponse)
		} else if (parsedMessage.toLowerCase().includes('error')) {
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
			const botResponse = {
				success: false,
				message:
					'npChatbot could not detect OBS. Please ensure OBS is running.',
			}
			event.reply('botProcessResponse', botResponse)
		}
		console.error(`stderr: IPC --> ${data}`)
	})
})

ipcMain.on('stopBotScript', async (event, arg) => {
	if (botProcess) {
		botProcess.on('exit', () => {
			botProcess = null
		})

		botProcess.kill()
		console.log('*** npChatBot PROCESS KILLED ***')
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
	mainWindow.webContents.send('userDataUpdated')
})

ipcMain.on('submitUserData', async (event, arg) => {
	const seratoDisplayName = arg.seratoDisplayName.replaceAll(' ', '_')

	const isValidSeratoURL = await seratoURLValidityCheck(seratoDisplayName)
	const isValidTwitchURL = await twitchURLValidityCheck(arg.twitchChannelName)
	const isValidTwitchChatbotURL = await twitchURLValidityCheck(
		arg.twitchChatbotName
	)

	if (isValidTwitchURL && isValidTwitchChatbotURL && isValidSeratoURL) {
		try {
			const data = await updateUserData(db, event, arg)
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
	mainWindow.loadURL(appURL)
	mainWindow.webContents.openDevTools()
}

app.on('ready', () => {
	protocol.registerHttpProtocol('npchatbot-app', (request, callback) => {
		const url = new URL(request.url)
		const code = url.searchParams.get('code')
		if (code) {
			mainWindow.webContents.send('auth-code', { auth_code: code })
		}
	})

	startServer()
	createWindow()
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
	if (process.platform !== 'darwin') {
		app.quit()
	}
})

app.on('activate', () => {
	if (BrowserWindow.getAllWindows().length === 0) {
		createWindow()
	}
})
