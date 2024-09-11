import React, { useState, useEffect, useRef } from 'react'
import TitleBar from './components/TitleBar'
import CredentialsPanel from './components/CredentialsPanel'
import PreferencesPanel from './components/PreferencesPanel'
import SessionPanel from './components/SessionPanel'
import MessagePanel from './components/MessagePanel'
import './App.css'

const App = (): JSX.Element => {
	/* STATE VALUES */

	const [formData, setFormData] = useState({
		_id: '',
		twitchChannelName: '',
		twitchChatbotName: '',
		twitchRefreshToken: '',
		seratoDisplayName: '',
		obsWebsocketAddress: '',
		obsWebsocketPassword: '',
		intervalMessageDuration: '',
		obsClearDisplayTime: '',
		userEmailAddress: '',
		isObsResponseEnabled: false,
		isIntervalEnabled: false,
		isReportEnabled: false,
	})

	const [error, setError] = useState('')
	const [isObsResponseEnabled, setIsObsResponseEnabled] = useState(false)
	const [isIntervalEnabled, setIsIntervalEnabled] = useState(false)
	const [isReportEnabled, setIsReportEnabled] = useState(false)
	const [showTooltip, setShowTooltip] = useState<string | null>(null)
	const [isBotConnected, setIsBotConnected] = useState(false)
	const [isAuthorized, setIsAuthorized] = useState(false)
	const [isConnectionReady, setIsConnectionReady] = useState(false)
	const [messageQueue, setMessageQueue] = useState<string[]>([])
	const [currentMessage, setCurrentMessage] = useState<string | null>(null)
	const messageTimeoutRef = useRef<NodeJS.Timeout | null>(null)
	const ipcRenderer = window.electron.ipcRenderer

	/* INTERFACE VALUES */

	interface BotProcessResponse {
		success: boolean
		message?: any
		error?: string
	}

	interface AuthSuccess {
		_id: string
		twitchRefreshToken: string
	}

	/* EFFECT HOOKS */

	// hook for successful twitch auth callback
	useEffect(() => {
		const socket = new WebSocket('ws://localhost:8080')
		socket.addEventListener('open', () => {
			console.log('WebSocket is open now.')
		})

		socket.addEventListener('message', (event) => {
			console.log('Message from server: ', event.data)
			addMessageToQueue(event.data)
			if (event.data !== 'npChatbot authorization with Twitch was cancelled.') {
				setIsAuthorized(true)
			}
		})

		socket.addEventListener('error', (event) => {
			console.error('WebSocket error:', event)
		})

		return () => {
			socket.close()
		}
	}, [])

	// effect hook to initially set user id in state
	// once the app has been authorized via Twitch
	useEffect(() => {
		const handleAuthSuccess = (response: AuthSuccess) => {
			console.log('Auth success:', response)
			setFormData((prevFormData) => ({
				...prevFormData,
				_id: response._id,
				twitchRefreshToken: response.twitchRefreshToken,
			}))
		}
		window.electron.ipcRenderer.on('auth-successful', handleAuthSuccess)
		return () => {
			window.electron.ipcRenderer.removeAllListeners('authSuccess')
		}
	}, [])

	// hook to set user data in client UI on app load
	useEffect(() => {
		const ipcRendererInstance = window.electron?.ipcRenderer
		if (ipcRendererInstance) {
			ipcRendererInstance.send('getUserData', {})
			const handleGetUserDataResponse = (response: any) => {
				if (response && Object.keys(response.data).length > 0) {
					setFormData(response.data)
					setIsObsResponseEnabled(response.data.isObsResponseEnabled)
					setIsIntervalEnabled(response.data.isIntervalEnabled)
					setIsReportEnabled(response.data.isReportEnabled)
					setIsAuthorized(!!response.data.appAuthorizationCode)
					setIsConnectionReady(
						// Check if all necessary fields are filled for connection
						!!response.data.twitchChannelName &&
							!!response.data.twitchChatbotName &&
							!!response.data.seratoDisplayName
					)
				} else {
					console.log('NO VALUES STORED')
				}
				console.log('USER DATA: ')
				console.log(response.data)
			}
			ipcRendererInstance.once('getUserDataResponse', handleGetUserDataResponse)
			return () => {
				ipcRendererInstance.removeAllListeners('getUserDataResponse')
			}
		}
	}, [])

	// hook to handle user response messages in the UI
	useEffect(() => {
		if (messageTimeoutRef.current) {
			clearTimeout(messageTimeoutRef.current)
			messageTimeoutRef.current = null
		}
		if (messageQueue.length > 0 || currentMessage) {
			if (messageQueue.length > 0) {
				const newMessage = messageQueue[0]
				setCurrentMessage(newMessage)
				setMessageQueue((prevQueue) => prevQueue.slice(1))
			}
			messageTimeoutRef.current = setTimeout(() => {
				setCurrentMessage(null)
			}, 5000)
		}
	}, [messageQueue, currentMessage])

	// hook to handle error messages from bot process
	useEffect(() => {
		const handleBotProcessData = (response: BotProcessResponse) => {
			console.log('Data from botProcess:', response)
			addMessageToQueue(response.message)
		}
		window.electron.ipcRenderer.on('botProcessResponse', handleBotProcessData)
		return () => {
			window.electron.ipcRenderer.removeAllListeners('botProcessResponse')
		}
	}, [])

	// hook to handle tooltip visibility
	useEffect(() => {
		const handleOutsideClick = (event: any) => {
			if (
				showTooltip &&
				!event.target.closest('.question-icon') &&
				!event.target.closest('.info-tooltip')
			) {
				setShowTooltip(null)
			}
		}
		window.addEventListener('click', handleOutsideClick)
		return () => {
			window.removeEventListener('click', handleOutsideClick)
		}
	}, [showTooltip])

	// FOR TESTING ONLY
	// effect hook to check if auth code returned from Twitch in packaged version
	useEffect(() => {
		const handleAuthCode = (response: any) => {
			console.log('Auth code:', response)
		}
		window.electron.ipcRenderer.on('auth-code', handleAuthCode)
		return () => {
			window.electron.ipcRenderer.removeAllListeners('auth-code')
		}
	}, [])

	/* CLIENT UI HELPER METHODS */

	// helper to add user response messages to message queue
	const addMessageToQueue = (newMessage: string) => {
		if (newMessage !== undefined) {
			setMessageQueue((prevQueue) => [...prevQueue, newMessage])
		} else return
	}

	// helper to validate submitted email string
	const isValidEmail = (email: string) => {
		var pattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/
		return pattern.test(email)
	}

	// handle npChatbot script connection
	const handleConnect = async (event: React.MouseEvent<HTMLButtonElement>) => {
		addMessageToQueue('Connecting to Twitch...')
		console.log('*** sending startBotScript ***')
		ipcRenderer.send('startBotScript', {
			twitchChannelName: formData.twitchChannelName,
			obsWebsocketAddress: formData.obsWebsocketAddress
				? formData.obsWebsocketAddress
				: '',
			obsWebsocketPassword: formData.obsWebsocketPassword
				? formData.obsWebsocketPassword
				: '',
			isObsResponseEnabled: formData.isObsResponseEnabled,
			twitchRefreshToken: formData.twitchRefreshToken,
		})
		console.log('*** startBotScript sent; awaiting response ***')
		ipcRenderer.on('startBotResponse', (response) => {
			if (response && response.success) {
				console.log('--- successfully startBotResponse ---')
				addMessageToQueue('npChatbot is connected to your Twitch chat')
				setIsBotConnected(true)
			} else if (response && response.error) {
				console.error(response.error)
				addMessageToQueue(response.error)
			} else {
				console.error('Unexpected response format from startBotResponse')
			}
		})
	}

	// handle npChatbot script disconnection
	const handleDisconnect = async (
		event: React.MouseEvent<HTMLButtonElement>
	) => {
		console.log('*** npChatbot disconnect event ***')
		ipcRenderer.send('stopBotScript', {})
		ipcRenderer.once('stopBotResponse', (response) => {
			if (response && response.success) {
				addMessageToQueue('npChatbot has been disconnected')
				setIsBotConnected(false)
			} else if (response && response.error) {
				console.log('Disconnection error: ', response.error)
				addMessageToQueue(response.error)
			} else {
				console.log('Unexpected response from stopBotResponse')
			}
		})
	}

	// handle user input changes
	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = event.target
		setFormData((prevFormData) => ({ ...prevFormData, [name]: value }))
	}

	// handle user credentials and preferences submission
	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		console.log('--- Form Data Submitted ---')
		console.log(formData)
		console.log('---------------------------')
		if (
			!formData.twitchChannelName ||
			!formData.twitchChatbotName ||
			!formData.seratoDisplayName
		) {
			setError('Please fill in all fields.')
			setTimeout(() => {
				setError('')
			}, 3000)
			return
		}
		addMessageToQueue('Updating...')
		if (isReportEnabled && formData.userEmailAddress === '') {
			setError('A valid email address is required for post-stream reporting.')
			return
		}
		if (isReportEnabled && !isValidEmail(formData.userEmailAddress)) {
			setError('Please enter a valid email address to enable this feature.')
			return
		}
		if (isIntervalEnabled && formData.intervalMessageDuration === '') {
			formData.intervalMessageDuration = '15'
		}
		if (isObsResponseEnabled && formData.obsClearDisplayTime === '') {
			formData.obsClearDisplayTime = '5'
		}

		const submitData = {
			...formData,
			isObsResponseEnabled,
			isIntervalEnabled,
			isReportEnabled,
		}

		ipcRenderer.send('submitUserData', submitData)
		ipcRenderer.once('userDataResponse', (response) => {
			console.log(response)
			if (response && response.success) {
				addMessageToQueue(response.message)
				setFormData(response.data)
				setIsConnectionReady(true)
			} else if (response && response.error) {
				console.log('Update error: ', response.error)

				addMessageToQueue(response.error)
			} else {
				console.log('Unexpected response when updating preferences')
			}
		})
	}

	return (
		<div className='App'>
			<div className='top-panel'>
				<TitleBar isAuthorized={isAuthorized} isBotConnected={isBotConnected} />
				<MessagePanel
					message={currentMessage || ''}
					error={error}
					showTooltip={showTooltip}
				/>
			</div>
			<div className='app-container'>
				<div className='creds-prefs-panel'>
					<CredentialsPanel
						formData={formData}
						handleInputChange={handleInputChange}
						showTooltip={showTooltip}
						setShowTooltip={setShowTooltip}
						handleSubmit={handleSubmit}
						isBotConnected={isBotConnected}
						isObsResponseEnabled={isObsResponseEnabled}
					/>
					<PreferencesPanel
						formData={formData}
						isObsResponseEnabled={isObsResponseEnabled}
						setIsObsResponseEnabled={setIsObsResponseEnabled}
						isIntervalEnabled={isIntervalEnabled}
						setIsIntervalEnabled={setIsIntervalEnabled}
						isReportEnabled={isReportEnabled}
						setIsReportEnabled={setIsReportEnabled}
						handleInputChange={handleInputChange}
						showTooltip={showTooltip}
						setShowTooltip={setShowTooltip}
						isBotConnected={isBotConnected}
					/>
				</div>
				<SessionPanel
					handleConnect={handleConnect}
					handleDisconnect={handleDisconnect}
					isBotConnected={isBotConnected}
					isAuthorized={isAuthorized}
					isConnectionReady={isConnectionReady}
				/>
			</div>
		</div>
	)
}

export default App
