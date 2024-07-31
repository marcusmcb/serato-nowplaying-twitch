const fs = require('fs')
const path = require('path')
const { app } = require('electron')

let logFilePath

if (process.env.NODE_ENV === 'development') {
	logFilePath = path.join(__dirname, '../application.log')
} else {
	const userDataPath = app.getPath('userData')
	logFilePath = path.join(userDataPath, 'application.log')
}

// Logging function
const logToFile = (message) => {
	const timestamp = new Date().toISOString()
	const logMessage = `${timestamp} - ${message}\n`
	fs.appendFileSync(logFilePath, logMessage, 'utf8')
}

module.exports = logToFile
