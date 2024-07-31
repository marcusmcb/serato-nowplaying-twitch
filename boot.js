const loadConfigurations = require('./config')
const initializeBot = require('./index')
const logToFile = require('./scripts/logger')

loadConfigurations()
	.then((config) => {
		setTimeout(() => {
			initializeBot(config)
		}, 1000)
	})
	.catch((err) => {
		logToFile(`Error loading configurations: ${err}`)
		logToFile("*******************************")
		console.error('Error loading configurations:', err)
	})
