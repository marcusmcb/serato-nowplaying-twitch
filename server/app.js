const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')

const app = express()

app.use(bodyParser.json())
app.use(cors())

app.get('/', (req, res) => {
  res.send('Hello world')
})

const PORT = 3001
app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`)
})
