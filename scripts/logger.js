const fs = require('fs')
const path = require('path')

const userDataPath = process.env.USER_DATA_PATH || path.join(__dirname, 'logs')

if (!fs.existsSync(userDataPath)) {
	fs.mkdirSync(userDataPath)
}

const logFilePath = path.join(userDataPath, 'app.log')

const logToFile = (message) => {
	const logMessage = `${new Date().toISOString()} - ${message}\n`
	fs.appendFileSync(logFilePath, logMessage)
}

module.exports = logToFile
