import React, { useState, useEffect } from 'react'
import axios from 'axios'
import TitleBar from './components/TitleBar'
import CredentialsPanel from './components/CredentialsPanel'
import PreferencesPanel from './components/PreferencesPanel'
import SessionPanel from './components/SessionPanel'
import './App.css'
import MessagePanel from './components/MessagePanel'

const App = (): JSX.Element => {
	const [formData, setFormData] = useState({
		twitchChannelName: '',
		twitchChatbotName: '',
		twitchOAuthKey: '',
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
	const [message, setMessage] = useState('')
	const [isObsResponseEnabled, setIsObsResponseEnabled] = useState(false)
	const [isIntervalEnabled, setIsIntervalEnabled] = useState(false)
	const [isReportEnabled, setIsReportEnabled] = useState(false)
	const [showTooltip, setShowTooltip] = useState<string | null>(null)
	const [isBotConnected, setIsBotConnected] = useState(false)

	useEffect(() => {		
		if (window.electron && window.electron.ipcRenderer) {
			window.electron.ipcRenderer.send('clientStarted', {})
			window.electron.ipcRenderer.on('clientStartResponse', (response) => {
				console.log("---- IPC RENDERER RESPONSE ----")
				console.log(response.message)
			})
			return () => {
				window.electron.ipcRenderer.removeAllListeners('clientStartResponse')
			}
		} else {
			console.error('Electron IPC Renderer is not available')
		}
	}, [])

	const isValidEmail = (email: string) => {
		var pattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/
		return pattern.test(email)
	}

	const handleConnect = async (event: React.MouseEvent<HTMLButtonElement>) => {
		console.log(event)
		console.log('Chatbot session connect clicked.')
		try {
			const response = await axios.post('http://localhost:5000/startBotScript')
			console.log(response.data)
			setMessage('')
			setMessage('npChatbot is connected to your Twitch chat')
			setIsBotConnected(true)
			setTimeout(() => {
				setMessage('')
			}, 3000)
		} catch (error) {
			console.error('Error starting the bot script:', error)
		}
	}

	const handleDisconnect = async (
		event: React.MouseEvent<HTMLButtonElement>
	) => {
		console.log('--- npChatbot disconnect event ---')
		try {
			const response = await axios.post('http://localhost:5000/stopBotScript')
			console.log(response.data)
			setMessage('')
			setMessage('npChatbot has been disconnected')
			setIsBotConnected(false)
			setTimeout(() => {
				setMessage('')
			}, 3000)
		} catch (error) {
			console.error('Error disconnecting the bot: ', error)
		}
	}

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = event.target
		setFormData((prevFormData) => ({ ...prevFormData, [name]: value }))
	}

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault()

		// Validate the form fields
		if (
			!formData.twitchChannelName ||
			!formData.twitchChatbotName ||
			!formData.twitchOAuthKey ||
			!formData.seratoDisplayName
		) {
			setError('Please fill in all fields.')
			return
		}
		setError('')
		console.log(formData)

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
		try {
			const response = await axios.post(
				`http://localhost:5000/submitUserData`,
				submitData
			)
			console.log('EXPRESS RESPONSE: ')
			console.log(response.data)
		} catch (error) {
			console.error('There was an error: ', error)
		}
		setMessage('Credentials successfully entered')
		setTimeout(() => {
			setMessage('')
		}, 3000)
	}

	useEffect(() => {
		const getData = async () => {
			console.log('APP RENDERED')
			try {
				const response = await axios.get('http://localhost:5000/getUserData')
				console.log('STORED USER DATA:')
				console.log(response.data)
				if (response.data && Object.keys(response.data).length > 0) {
					setFormData(response.data)
					setIsObsResponseEnabled(response.data.isObsResponseEnabled)
					setIsIntervalEnabled(response.data.isIntervalEnabled)
					setIsReportEnabled(response.data.isReportEnabled)
				}
			} catch (error: any) {
				if (error.response && error.response.status === 404) {
					console.log('Database does not exist yet.')
				} else {
					console.error('An error has occurred: ', error)
				}
			}
		}
		getData()
	}, [])

	useEffect(() => {
		setIsObsResponseEnabled(false) // Always reset to false whenever address or password changes
	}, [formData.obsWebsocketAddress, formData.obsWebsocketPassword])

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

	return (
		<div className='App'>
			<TitleBar />
			<div className='app-container'>
				<CredentialsPanel
					formData={formData}
					handleInputChange={handleInputChange}
					showTooltip={showTooltip}
					setShowTooltip={setShowTooltip}
					handleSubmit={handleSubmit}
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
				/>
				<SessionPanel
					handleConnect={handleConnect}
					handleDisconnect={handleDisconnect}
					isBotConnected={isBotConnected}
				/>
			</div>
			<MessagePanel message={message} error={error} showTooltip={showTooltip} />
		</div>
	)
}

export default App
