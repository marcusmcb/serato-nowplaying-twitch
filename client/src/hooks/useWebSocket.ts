import { useEffect, useRef } from 'react'

const useWebSocket = (
	url: string,
	onMessage: (event: MessageEvent) => void,
	onOpen?: () => void,
	onError?: (event: Event) => void
) => {
	const socketRef = useRef<WebSocket | null>(null)

	useEffect(() => {
		const socket = new WebSocket(url)
		socketRef.current = socket

		const handleOpen = () => {
			if (onOpen) onOpen()
		}
		const handleMessage = (event: MessageEvent) => {
			onMessage(event)
		}
		const handleError = (event: Event) => {
			console.error(`WebSocket error: ${url}`, event)
			if (onError) onError(event)
		}

		socket.addEventListener('open', handleOpen)
		socket.addEventListener('message', handleMessage)
		socket.addEventListener('error', handleError)

		// socket.addEventListener('close', () => {
		// 	console.log(`WebSocket is closed now: ${url}`)
		// 	socket.close()
		// })

		return () => {
			socket.removeEventListener('open', handleOpen)
			socket.removeEventListener('message', handleMessage)
			socket.removeEventListener('error', handleError)
			if (
				socket.readyState === WebSocket.OPEN ||
				socket.readyState === WebSocket.CONNECTING
			) {
				socket.close()
			}
			if (socketRef.current === socket) {
				socketRef.current = null
			}
		}
	}, [url, onMessage, onOpen, onError])

	return socketRef.current
}

export default useWebSocket
