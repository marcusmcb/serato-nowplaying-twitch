// global.d.ts
console.log("--- globals ---")
export {} // this file needs to be a module

declare global {
	interface Window {
		electron: {
			ipcRenderer: {
				send: (channel: string, data?: any) => void
				on: (channel: string, func: (...args: any[]) => void) => void
				removeAllListeners: (channel: string) => void
			}
		}
	}
}
