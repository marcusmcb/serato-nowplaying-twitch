const loadConfigurations = require('./config')
const initializeBot = require('./index') // This imports the function from your index.js

loadConfigurations()
	.then((config) => {
		initializeBot(config) // This starts your bot using the loaded configurations
	})
	.catch((err) => {
		console.error('Error loading configurations:', err)
	})
