const loadConfigurations = require('./config')
const initializeBot = require('./index')

loadConfigurations()
	.then((config) => {
		setTimeout(() => {
			initializeBot(config)
		}, 1000)
	})
	.catch((err) => {
		console.error('Error loading configurations:', err)
	})
