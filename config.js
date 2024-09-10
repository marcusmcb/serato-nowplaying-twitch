const db = require('./database') // Import the database module
const logToFile = require('./scripts/logger')

// Function to load user configurations from the database
const loadConfigurations = () => {
	return new Promise((resolve, reject) => {
		db.users.findOne({}, (err, user) => {
			if (err) {
				logToFile(`Database error: ${err}`)
				logToFile('*******************************')
				reject(err)
			} else if (user) {
				console.log('--------------')
				console.log('USER CONFIG: ')
				console.log(user)
				console.log('--------------')
				logToFile(`User found: ${JSON.stringify(user)}`)
				logToFile('*******************************')
				resolve(user)
			} else {
				logToFile('No user configurations found.')
				logToFile('*******************************')
				reject(new Error('No user configurations found.'))
			}
		})
	})
}

module.exports = loadConfigurations
