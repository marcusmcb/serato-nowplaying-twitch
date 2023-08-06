const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const Datastore = require('nedb')
const db = {}

const PORT = process.env.PORT || 5000
const app = express()

app.use(bodyParser.json())
app.use(cors())

// db.users = new Datastore({ filename: 'users.db', autoload: true })
// db.preferences = new Datastore({ filename: 'preferences.db', autoload: true })

app.get('/', (req, res) => {
	res.send('Hello world, I am here YO!')
})

app.post("/test", (req, res) => {
  console.log(req.body)
  res.send('Received')
})

app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`)
})
