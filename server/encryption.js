const crypto = require('crypto')

const algorithm = 'aes-256-cbc' // AES encryption
const key = crypto.randomBytes(32) // Generate a secure random key
const iv = crypto.randomBytes(16) // Generate a secure initialization vector

// Encrypt function
function encrypt(text) {
	let cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv)
	let encrypted = cipher.update(text)
	encrypted = Buffer.concat([encrypted, cipher.final()])
	return { iv: iv.toString('hex'), encryptedData: encrypted.toString('hex') }
}

// Decrypt function
function decrypt(text) {
	let iv = Buffer.from(text.iv, 'hex')
	let encryptedText = Buffer.from(text.encryptedData, 'hex')
	let decipher = crypto.createDecipheriv(algorithm, Buffer.from(key), iv)
	let decrypted = decipher.update(encryptedText)
	decrypted = Buffer.concat([decrypted, decipher.final()])
	return decrypted.toString()
}

const testEncryptionKeys = (twitchOAuthKey) => {
	console.log('-------------')
  console.log(twitchOAuthKey)
  let encrypted = encrypt(twitchOAuthKey)
  console.log(encrypted)
  let decrypted = decrypt(encrypted)
  console.log(decrypted)
	// console.log(twitchOAuthKey)
}

module.exports = testEncryptionKeys
