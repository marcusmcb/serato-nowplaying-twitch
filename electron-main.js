const { app, BrowserWindow } = require('electron')
const path = require('path')
const spawn = require('cross-spawn')
// const isDev = require('electron-is-dev')

let mainWindow
let serverProcess

const isDev = false

function startServer() {
	if (!isDev) {
		console.log('Starting server from:', process.cwd())
		serverProcess = spawn('npm', ['run', 'server'], {
			cwd: process.cwd(),
			detached: true,
			stdio: 'ignore',
			shell: true,
			windowsHide: true
		})

		serverProcess.on('error', (err) => {
			console.log('Failed to start server:', err)
		})

		serverProcess.on('close', (code) => {
			console.log(`Server process exited with code ${code}`)
		})
	}
}

function createWindow() {
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

app.on('ready', () => {
	startServer()
	createWindow()
})

app.on('before-quit', () => {
	if (mainWindow) {
		mainWindow.destroy()
	}
	if (serverProcess) {
		process.kill(-serverProcess.pid)
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
