const db = require('./database')

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
				resolve(user)
			} else {
				reject(new Error('No user configurations found.'))
			}
		})
	})
}

module.exports = loadConfigurations
