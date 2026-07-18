const tooltipTexts = {
	twitchChannelName: 'Enter the Twitch© channel name you stream from here.',
	twitchChatbotName:
		"Enter the name of the Twitch© channel you've linked npChatbot with here. More details can be found <a href='https://www.npchatbot.com/' rel='noreferrer' target='_blank'>here</a>.",
	obsClearDisplayTime:
		'Enter the duration (in seconds) for the OBS text response to remain on screen.   This feature is enabled when you enter your OBS Websocket address.',
	seratoDisplayName:
		'Enter your Serato© profile display name here.  More details on how to find this can be found <a href="https://www.npchatbot.com/installation?tab=Credentials" rel="noreferrer" target="_blank">here</a>.',
	intervalMessageDuration:
		"Enter the interval (in minutes) for automatic chat messages to appear.  More details about this feature can be found <a href='https://www.npchatbot.com/installation?tab=Preferences' rel='noreferrer' target='_blank'>here</a>.",
	obsWebsocketAddress:
		'Enter your local OBS web socket address here (optional) in the same format shown in the example (address:port).',
	obsWebsocketPassword:
		'If your web socket connection is secured within OBS, please enter the password here (optional)',
	obsResponseToggle:
		'Enable this feature to show chat responses in OBS. Requires Twitch authorization and an OBS Websocket address.',
	spotifyPlaylistEnabled:
		'With this feature enabled, a Spotify© playlist of your current set will be created each time you connect npChatbot to Twitch.',
	continueLastPlaylist:
		'If you need to disconnect and reconnect npChatbot to Twitch© during your stream, enabling this feature will continue adding songs to the last Spotify© playlist created instead of creating a new one.',
	autoIDEnabled:
		'Enable this feature to automatically display the song currently playing in your chat as it updates.',
	autoIDCleanupEnabled:
		"With Auto ID enabled, this feature removes any text within brackets or parentheses from the current song's artist & title when displayed in your chat.",
	autoIDDelayEnabled:
		'With Auto ID enabled, this waits the entered number of seconds before posting each newly detected song to Twitch chat.',
	intervalMessageToggle:
		'Enable this feature to send automatic interval messages to chat while connected.',
}

export default tooltipTexts
