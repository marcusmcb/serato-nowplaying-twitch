const Datastore = require('nedb')

const db = {}
db.users = new Datastore({ filename: 'users.db', autoload: true })

function loadConfigurations() {
	return new Promise((resolve, reject) => {
		db.users.findOne({}, (err, user) => {
			if (err) {
				reject(err)
			} else if (user) {
				resolve(user)
			} else {
				reject(new Error('No user configurations found.'))
			}
		})
	})
}

module.exports = loadConfigurations // Export the function
