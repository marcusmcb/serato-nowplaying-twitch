import React, { useState, useEffect } from 'react'
import axios from 'axios'
import TitleBar from './components/TitleBar'
import CredentialsPanel from './components/CredentialsPanel'
import PreferencesPanel from './components/PreferencesPanel'
import SessionPanel from './components/SessionPanel'
import './App.css'
import MessagePanel from './components/MessagePanel'

const App = (): JSX.Element => {
	console.log("APP RENDERED")
	console.log("------------")
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
		isReportEnabled: false
	})

	const [error, setError] = useState('')
	const [message, setMessage] = useState('')

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
		setMessage('Credentials successfully entered')
		const submitData = {
			...formData,
			isObsResponseEnabled,
			isIntervalEnabled,
			isReportEnabled
		}
		try {
			const response = await axios.post(`http://localhost:5000/test`, submitData)
			console.log('EXPRESS RESPONSE: ')
			console.log(response.data)
		} catch (error) {
			console.error('There was an error: ', error)
		}
		setTimeout(() => {
			setMessage('')
		}, 3000)
	}

	// Manage the state to enable/disable obsResponseToggle
	const [isObsResponseEnabled, setIsObsResponseEnabled] = useState(false)
	const [isIntervalEnabled, setIsIntervalEnabled] = useState(false)
	const [isReportEnabled, setIsReportEnabled] = useState(false)
	const [showTooltip, setShowTooltip] = useState<string | null>(null)

	useEffect(() => {
		const getData = async () => {
			try {
				const response = await axios.get('http://localhost:5000/userInfo')
				console.log('STORED USER DATA:')
				console.log(response.data)
				if (response.data && Object.keys(response.data).length > 0) {
					setFormData(response.data)
				}
			} catch (error) {
				console.error('An error has occurred: ', error)
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
				<SessionPanel/>				
			</div>
			<MessagePanel
				message={message}
				error={error}
				showTooltip={showTooltip}				
			/>
		</div>
	)
}

export default App
