const fs = require('fs')
const { spawn } = require('child_process')
const path = require('path')
const bodyParser = require('body-parser')
const cors = require('cors')
const express = require('express')
const { app, BrowserWindow, ipcMain } = require('electron')
const isDev = require('electron-is-dev')
const scriptPath = path.join(__dirname, './boot.js')
const { exchangeCodeForToken } = require('./auth/createAccessToken')

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
	event.reply('getUserDataResponse', {
		message: 'user data endpoint has been called'
	})
})

server.get('/getUserData', (req, res) => {
	if (fs.existsSync('users.db')) {
		console.log('users.db exists! Fetching the user information...')
		let preloadPath = path.join(__dirname, './scripts/preload.js')
		console.log(preloadPath)
		db.users.findOne({}, (err, user) => {
			if (err) {
				console.error('Error fetching the user:', err)
			} else if (user) {
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

// server.post('/submitUserData', async (req, res) => {
// 	// Encrypt the OAuthKey if it's provided and has changed
// 	// let encryptedOAuthKey = ''
// 	// if (req.body.twitchOAuthKey) {
// 	// 	encryptedOAuthKey = await encryptCredential(req.body.twitchOAuthKey)
// 	// }

// 	db.users.findOne({}, async (err, existingUser) => {
// 		if (err) {
// 			console.error('Error fetching the user:', err)
// 			return res.status(500).send('Database error.')
// 		}

// 		// If there's an existing user, update only the changed fields
// 		if (existingUser) {
// 			const updatedUser = { ...existingUser }

// 			// Iterate over the keys in the request body to update only changed values
// 			Object.keys(req.body).forEach((key) => {
// 				if (req.body[key] !== existingUser[key]) {
// 					updatedUser[key] = req.body[key]
// 				}
// 			})

// 			// Special handling for the twitchOAuthKey to use the encrypted version
// 			// if (req.body.twitchOAuthKey) {
// 			// 	updatedUser.twitchOAuthKey = encryptedOAuthKey
// 			// }

// 			await db.users.update(
// 				{ _id: existingUser._id },
// 				{ $set: updatedUser },
// 				{},
// 				(err, numReplaced) => {
// 					if (err) {
// 						console.error('Error updating the user:', err)
// 						return res.status(500).send('Database error during update.')
// 					}
// 					console.log(`Updated ${numReplaced} user(s) with new data.`)
// 					res.send(updatedUser)
// 				}
// 			)
// 		} else {
// 			// If there's no existing user, insert a new one (or handle as an error)
// 			console.log(
// 				'No existing user found. Inserting new user or handling error.'
// 			)
// 			// Insert new user logic here, or return an error response
// 		}
// 	})
// })

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

ipcMain.on('clientStarted', async (event, arg) => {
	event.reply('clientStartResponse', {
		message: 'ipcMain process connected to client app',
	})
})

// IPC listener for starting the bot script
ipcMain.on('startBotScript', async (event, arg) => {
	if (botProcess) {
		console.log('Bot is already running.')
		event.reply('startBotResponse', {
			success: false,
			error: 'Bot is already running.',
		})
		return
	}

	botProcess = spawn('node', [scriptPath], { stdio: 'inherit' })

	// botProcess.stdout.on('data', (data) => {
	// 	console.log(`stdout: IPC --> ${data}`)
	// })

	// botProcess.stderr.on('data', (data) => {
	// 	console.error(`stderr: IPC --> ${data}`)
	// })

	// botProcess.on('close', (code) => {
	// 	console.log(`botProcess process exited with code ${code}`)
	// 	botProcess = null
	// 	// Optionally, notify the renderer process here
	// })

	// Assume bot startup is successful for now
	event.reply('startBotResponse', {
		success: 'ipcMain: bot process successfully started',
	})
})

ipcMain.on('stopBotScript', async (event, arg) => {
	if (botProcess) {
		botProcess.on('exit', () => {
			console.log('botProcess has exited.')
			botProcess = null
		})

		botProcess.kill()
		event.reply('stopBotResponse', {
			success: 'ipcMain: bot process successfully exited',
		})
	} else {
		event.reply('ipcMain: no bot process running to exit')
	}
})

ipcMain.on('submitUserData', async (event, arg) => {
	console.log('--- submit user data event ---')

	db.users.findOne({}, async (err, existingUser) => {
		if (err) {
			console.error('Error fetching the user:', err)
			// return res.status(500).send('Database error.')
			event.reply('userDataResponse', { error: 'ipcMain: no user found' })
		}

		// If there's an existing user, update only the changed fields
		if (existingUser) {
			const updatedUser = { ...existingUser }

			// Iterate over the keys in the request body to update only changed values
			Object.keys(arg).forEach((key) => {
				if (arg[key] !== existingUser[key]) {
					updatedUser[key] = arg[key]
				}
			})

			// Special handling for the twitchOAuthKey to use the encrypted version
			// if (req.body.twitchOAuthKey) {
			// 	updatedUser.twitchOAuthKey = encryptedOAuthKey
			// }

			try {
				const numReplaced = await new Promise((resolve, reject) => {
					db.users.update(
						{ _id: existingUser._id },
						{ $set: updatedUser },
						{},
						(err, numReplaced) => {
							if (err) {
								reject(err)
							} else {
								resolve(numReplaced)
							}
						}
					)
				})
				console.log(`Updated ${numReplaced} user(s) with new data.`)
				event.reply('userDataResponse', {
					success: 'User data successfully updated',
				})
			} catch (error) {
				console.error('Error updating the user:', error)
				event.reply('userDataResponse', {
					error: 'Error updating user data',
				})
			}
		} else {
			// If there's no existing user, insert a new one (or handle as an error)
			console.log(
				'No existing user found. Inserting new user or handling error.'
			)
			// Insert new user logic here, or return an error response
		}
	})
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
