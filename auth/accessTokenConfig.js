const returnAccessTokenConfig = (config) => {
	const connectWithAccessTokenConfig = {
		options: { debug: true },
		connection: {
			secure: true,
			reconnect: true,
		},
		identity: {
			username: config.twitchChatbotName,
			password: 'oauth:' + config.twitchAccessToken,
		},
		channels: [config.twitchChannelName],
	}
	return connectWithAccessTokenConfig
}

const returnRefreshTokenConfig = (config, token) => {
	const connectWithRefreshTokenConfig = {
		options: { debug: true },
		connection: {
			secure: true,
			reconnect: true,
		},
		identity: {
			username: config.twitchChatbotName,
			password: 'oauth:' + token,
		},
		channels: [config.twitchChannelName],
	}
	return connectWithRefreshTokenConfig
}

module.exports = { returnAccessTokenConfig, returnRefreshTokenConfig }
