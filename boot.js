const loadConfigurations = require('./config')
const initializeBot = require('./index')

loadConfigurations()
	.then((config) => {
		initializeBot(config)
	})
	.catch((err) => {
		console.error('Error loading configurations:', err)
	})
