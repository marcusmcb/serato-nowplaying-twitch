export {} // this file needs to be a module

declare global {
	interface Window {
		electron: {
			ipcRenderer: {
				send: (channel: string, data?: any) => void
				invoke: (channel: string, data?: any) => Promise<any>
				on: (channel: string, func: (...args: any[]) => void) => void
				once: (channel: string, func: (...args: any[]) => void) => void
				removeAllListeners: (channel: string) => void
			}
			getUserData: () => Promise<any>
			startBotScript: (data?: any) => Promise<any>
			stopBotScript: (data?: any) => Promise<any>
			getPlaylistSummaries: () => Promise<any>
			validateLivePlaylist: (data?: any) => Promise<any>
			submitUserData: (data?: any) => Promise<any>
			deleteSelectedPlaylist: (playlistId?: any) => Promise<any>
			sharePlaylistToDiscord: (data?: any) => Promise<any>
			logToMain?: (message: string) => void
		}
	}
}
