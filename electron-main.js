const { app, BrowserWindow } = require('electron')
const path = require('path')
const url = require('url')
const { spawn } = require('child_process')
let serverProcess

function startServer() {
	// Start your Express server
	serverProcess = spawn('npm', ['run', 'server'], {
		cwd: process.cwd(),
		detached: true,
		stdio: 'inherit',
	})

	serverProcess.on('close', (code) => {
		console.log(`Server process exited with code ${code}`)
	})
}

let mainWindow

app.on('ready', () => {
	// ... Your code for starting the chatbot script ...
	startServer()
	// Create a new Electron browser window for the React app
	mainWindow = new BrowserWindow({
		width: 1280,
		height: 680,
		webPreferences: {
			nodeIntegration: true,
		},
	})

	// Load the React app
	const isDev = require('electron-is-dev')

	let appURL = isDev
		? 'http://localhost:3000' // URL of your local dev server
		: `file://${path.join(__dirname, '../client/build/index.html')}` // Path to your production build file

	mainWindow.loadURL(appURL)

	// Uncomment the following line if you want to open the DevTools for debugging
	// mainWindow.webContents.openDevTools();

	// ... Your code for handling window events ...
})

// Handle the closing of the Electron app
app.on('before-quit', () => {
	if (mainWindow) {
		mainWindow.destroy()
	}
	if (serverProcess) {
		process.kill(-serverProcess.pid) // Kills the entire subprocess tree
	}
})
