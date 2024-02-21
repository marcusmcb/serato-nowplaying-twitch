// In preload.js
console.log('--- preload ---')
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electron', {
	ipcRenderer: {
		send: (channel, data) => ipcRenderer.send(channel, data),
		on: (channel, func) => {
			const subscription = (_, ...args) => func(...args)
			ipcRenderer.on(channel, subscription)

			return () => ipcRenderer.removeListener(channel, subscription)
		},
		removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
	},
})
