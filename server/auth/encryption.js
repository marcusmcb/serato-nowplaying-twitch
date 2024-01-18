const keytar = require('keytar')
const crypto = require('crypto')

const SERVICE_NAME = 'npChatbot'
const KEY_ACCOUNT = 'encryptionKey'
const IV_ACCOUNT = 'encryptionIV'

const getKeyAndIV = async () => {
	let key = await keytar.getPassword(SERVICE_NAME, KEY_ACCOUNT)
	let iv = await keytar.getPassword(SERVICE_NAME, IV_ACCOUNT)

	if (!key || !iv) {
		key = crypto.randomBytes(32).toString('hex')
		iv = crypto.randomBytes(16).toString('hex')

		await keytar.setPassword(SERVICE_NAME, KEY_ACCOUNT, key)
		await keytar.setPassword(SERVICE_NAME, IV_ACCOUNT, iv)
	}

	return {
		key: Buffer.from(key, 'hex'),
		iv: Buffer.from(iv, 'hex'),
	}
}

const encryptCredential = async (text) => {
	const { key, iv } = await getKeyAndIV()
	let cipher = crypto.createCipheriv('aes-256-cbc', key, iv)
	let encrypted = cipher.update(text)
	encrypted = Buffer.concat([encrypted, cipher.final()])
	return { iv: iv.toString('hex'), encryptedData: encrypted.toString('hex') }
}

const decryptCredential = async (text) => {
	const { key, iv } = await getKeyAndIV()
	let ivBuffer = Buffer.from(text.iv, 'hex')
	let encryptedText = Buffer.from(text.encryptedData, 'hex')
	let decipher = crypto.createDecipheriv('aes-256-cbc', key, ivBuffer)
	let decrypted = decipher.update(encryptedText)
	decrypted = Buffer.concat([decrypted, decipher.final()])
	return decrypted.toString()
}

// test method
const testEncryptionKeys = async (twitchOAuthKey) => {
	console.log('-------------')
	console.log(twitchOAuthKey)
	let encrypted = await encryptCredential(twitchOAuthKey)
	console.log(encrypted)
	let decrypted = await decryptCredential(encrypted)
	console.log(decrypted)
}

module.exports = {
	testEncryptionKeys: testEncryptionKeys,
	encryptCredential: encryptCredential,
	decryptCredential: decryptCredential,
}
