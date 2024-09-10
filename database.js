const Datastore = require('nedb')
const path = require('path')
const fs = require('fs')
const { app } = require('electron')

let dbPath

if (process.env.DB_PATH) {
	dbPath = process.env.DB_PATH
} else {
	if (process.env.NODE_ENV === 'development') {
		dbPath = path.join(__dirname, 'users.db')
	} else {
		const userDataPath = app.getPath('userData')
		dbPath = path.join(userDataPath, 'users.db')
		if (!fs.existsSync(dbPath)) {
			fs.copyFileSync(path.join(__dirname, 'users.db'), dbPath)
			console.log(`Database file copied to: ${dbPath}`)
		}
	}
}

const db = {}
db.users = new Datastore({ filename: dbPath, autoload: true })

module.exports = db
