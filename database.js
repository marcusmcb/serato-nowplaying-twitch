const Datastore = require('nedb')
const path = require('path')
const fs = require('fs')
const { app } = require('electron')

// Determine the correct path for the database
let dbPath

if (process.env.DB_PATH) {
	dbPath = process.env.DB_PATH
} else {
	if (process.env.NODE_ENV === 'development') {
		dbPath = path.join(__dirname, 'users.db')
	} else {
		const userDataPath = app.getPath('userData')
		dbPath = path.join(userDataPath, 'users.db')

		// Ensure that the users.db file is copied to the userData directory if it does not exist
		if (!fs.existsSync(dbPath)) {
			fs.copyFileSync(path.join(__dirname, 'users.db'), dbPath)
			console.log(`Database file copied to: ${dbPath}`)
		}
	}
}

// Initialize the database with the correct path
const db = {}
db.users = new Datastore({ filename: dbPath, autoload: true })

module.exports = db
