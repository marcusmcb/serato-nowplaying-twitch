const { app } = require('electron')
const fs = require('fs')
const path = require('path')

const userDataPath = app.getPath('userData')

const logDirPath = path.join(userDataPath, 'logs')

if (!fs.existsSync(logDirPath)) {
	fs.mkdirSync(logDirPath)
}

const logFilePath = path.join(logDirPath, 'npchatbot.log')

const logToFile = (message) => {
	const logMessage = `${new Date().toISOString()} - ${message}\n`
	fs.appendFileSync(logFilePath, logMessage)
}

module.exports = logToFile
