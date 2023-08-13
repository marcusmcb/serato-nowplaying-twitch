const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const Datastore = require('nedb')
const fs = require('fs')

const db = {}

const PORT = process.env.PORT || 5000
const app = express()

app.use(bodyParser.json())
app.use(cors())

db.users = new Datastore({ filename: 'users.db', autoload: true })
db.preferences = new Datastore({ filename: 'preferences.db', autoload: true })

app.get('/', (req, res) => {
	res.send('Hello world, I am here YO!')
})

app.get('/userInfo', (req, res) => {
	if (fs.existsSync('users.db')) {
		console.log('users.db exists! Fetching the latest user information...')

		// Fetch the latest user. Here, I'm assuming you have a timestamp or some way of determining "latest."
		// If not, consider adding a timestamp field when inserting a user.
		db.users
			.find({})
			.sort({ _id: -1 })
			.limit(1)
			.exec((err, users) => {
				if (err) {
					console.error('Error fetching the latest user:', err)
				} else if (users && users.length) {
					console.log('Latest user information:', users[0])
          res.send(users[0])
				} else {
					console.log('No users found in the database.')
				}
			})
	} else {
		console.log('users.db does not exist yet.')
	}
})

app.post('/test', async (req, res) => {
	console.log(req.body)

	const user = {
		twitchChannelName: req.body.twitchChannelName,
		twitchChatbotName: req.body.twitchChatbotName,
		twitchOAuthKey: req.body.twitchOAuthKey,
		seratoDisplayName: req.body.seratoDisplayName,
		obsWebsocketAddress: req.body.obsWebsocketAddress,
		obsWebsocketPassword: req.body.obsWebsocketPassword,
		intervalMessageDuration: Number(req.body.intervalMessageDuration),
    obsClearDisplayTime: Number(req.body.obsClearDisplayTime),
		userEmailAddress: req.body.userEmailAddress,
	}

	await db.users.insert(user, (err, newUser) => {
		if (err) return res.status(500).send({ error: 'Database error.' })
    console.log(newUser)
		res.json(newUser)
	})	
})

app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`)
})
