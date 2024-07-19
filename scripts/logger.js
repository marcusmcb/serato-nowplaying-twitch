const fs = require('fs')
const path = require('path')
const logFilePath = path.join(__dirname, '../application.log')

// Logging function
const logToFile = (message) => {
	const timestamp = new Date().toISOString()
	const logMessage = `${timestamp} - ${message}\n`
	fs.appendFileSync(logFilePath, logMessage, 'utf8')
}

module.exports = logToFile