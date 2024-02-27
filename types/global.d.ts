export {} // this file needs to be a module

declare global {
	interface Window {
		electron: {
			ipcRenderer: {
				send: (channel: string, data?: any) => void
				on: (channel: string, func: (...args: any[]) => void) => void
				once: (channel: string, func: (...args: any[]) => void) => void // Add this line
				removeAllListeners: (channel: string) => void
			}
		}
	}
}
