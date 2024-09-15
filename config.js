const db = require('./database')
// const logToFile = require('./scripts/logger')

const loadConfigurations = () => {
	return new Promise((resolve, reject) => {
		db.users.findOne({}, (err, user) => {
			if (err) {
				reject(err)
			} else if (user) {
				console.log('User credentials & preferences loaded')
				console.log('--------------------------------------')
				resolve(user)
			} else {
				reject(new Error('No user configurations found.'))
			}
		})
	})
}

module.exports = loadConfigurations
