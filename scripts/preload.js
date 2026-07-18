const { contextBridge, ipcRenderer, shell } = require('electron')
console.log('[preload] script executed')

contextBridge.exposeInMainWorld('electron', {
	ipcRenderer: {
		send: (channel, data) => ipcRenderer.send(channel, data),
		invoke: (channel, data) => ipcRenderer.invoke(channel, data),
		on: (channel, func) => {
			const subscription = (_, ...args) => func(...args)
			ipcRenderer.on(channel, subscription)
			return () => ipcRenderer.removeListener(channel, subscription)
		},
		once: (channel, func) => {
			ipcRenderer.once(channel, (_, ...args) => func(...args))
		},
		removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),		
	},
	getUserData: () => ipcRenderer.invoke('get-user-data', {}),
	startBotScript: (data) => ipcRenderer.invoke('start-bot-script', data),
	stopBotScript: (data) => ipcRenderer.invoke('stop-bot-script', data),
	getPlaylistSummaries: () => ipcRenderer.invoke('get-playlist-summaries', {}),
	validateLivePlaylist: (data) =>
		ipcRenderer.invoke('validate-live-playlist', data),
	submitUserData: (data) => ipcRenderer.invoke('submit-user-data', data),
	deleteSelectedPlaylist: (playlistId) =>
		ipcRenderer.invoke('delete-selected-playlist', playlistId),
	sharePlaylistToDiscord: (data) =>
		ipcRenderer.invoke('share-playlist-to-discord', data),
  // optional utility: forward logs to main process logger
  logToMain: (message) => {
    try {
      ipcRenderer.send('renderer-log', message)
    } catch (e) {
      // noop
    }
  },
})
