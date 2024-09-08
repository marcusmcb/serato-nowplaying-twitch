const { app } = require('electron')
const fs = require('fs')
const path = require('path')

let userDataPath

// Check if the script is running in an Electron environment
if (process.type) {
  // Running in Electron
  const { app } = require('electron');
  userDataPath = app.getPath('userData');
} else {
  // Running in Node.js (dev mode)
  userDataPath = path.join(__dirname, 'logs'); // or another directory suitable for your development environment
}

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
