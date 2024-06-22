const fs = require('fs')
const path = require('path')

const filePath = path.join(__dirname, '../client/build/index.html')
fs.readFile(filePath, 'utf8', (err, data) => {
	if (err) {
		console.error('Error reading index.html:', err)
		return
	}
	let result = data.replace(/\/static\//g, './static/')
	fs.writeFile(filePath, result, 'utf8', (err) => {
		if (err) {
			console.error('Error writing index.html:', err)
		} else {
			console.log('Paths in index.html have been fixed.')
		}
	})
})
