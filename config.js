const db = require('./database')
const logToFile = require('./scripts/logger')

const loadConfigurations = () => {
	return new Promise((resolve, reject) => {
		db.users.findOne({}, (err, user) => {
			if (err) {
				reject(err)
			} else if (user) {
				console.log("--------------")
				console.log("USER CONFIG: ")
				console.log(user)
				console.log("--------------")
				logToFile(`User found: ${JSON.stringify(user)}`)
				logToFile("*******************************")
				resolve(user)
			} else {
				logToFile('No user configurations found.')
				reject(new Error('No user configurations found.'))
				logToFile("*******************************")
			}
		})
	})
}

module.exports = loadConfigurations
