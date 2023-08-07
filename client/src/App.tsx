import React, { useState, useEffect } from 'react'
import axios from 'axios'
import TitleBar from './components/TitleBar'
import './App.css'

const App = (): JSX.Element => {
	const [formData, setFormData] = useState({
		twitchChannelName: '',
		twitchChatbotName: '',
		oauthKey: '',
		seratoDisplayName: '',
		obsWebsocketAddress: '',
		obsWebsocketPassword: '',
		obsIntervalDuration: '',
		obsClearDisplayTime: '',
		userEmailAddress: '',
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
			!formData.oauthKey ||
			!formData.seratoDisplayName
		) {
			setError('Please fill in all fields.')
			return
		}
		setError('')
		console.log(formData)
		setMessage('Credentials successfully entered')
		try {
			const response = await axios.post(`http://localhost:5000/test`, formData)
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
			} catch (error) {
				console.error('An error has occurred: ', error)
			}
		}
		getData()
	}, [])

	// ... rest of your imports and useState initializations ...

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
				<div className='app-container-column'>
					<div className='app-form-title'>Enter your credentials below:</div>
					<form className='app-form' onSubmit={handleSubmit}>
						<div className='form-field'>
							<label htmlFor='twitch-channel-name'>Twitch Channel Name:</label>
							<input
								type='text'
								id='twitch-channel-name'
								name='twitchChannelName'
								value={formData.twitchChannelName}
								onChange={handleInputChange}
							/>
							<span
								className={`question-icon ${
									showTooltip === 'twitchChannelName' ? 'active-icon' : ''
								}`}
								onClick={() =>
									setShowTooltip(
										showTooltip === 'twitchChannelName'
											? null
											: 'twitchChannelName'
									)
								}
							>
								?
							</span>
						</div>
						<div className='form-field'>
							<label htmlFor='twitch-chatbot-name'>Twitch Chatbot Name:</label>
							<input
								type='text'
								id='twitch-chatbot-name'
								name='twitchChatbotName'
								value={formData.twitchChatbotName}
								onChange={handleInputChange}
							/>
							<span
								className={`question-icon ${
									showTooltip === 'twitchChatbotName' ? 'active-icon' : ''
								}`}
								onClick={() =>
									setShowTooltip(
										showTooltip === 'twitchChatbotName'
											? null
											: 'twitchChatbotName'
									)
								}
							>
								?
							</span>
						</div>
						<div className='form-field'>
							<label htmlFor='oauth-key'>Twitch OAuth Key:</label>
							<input
								type='text'
								id='oauth-key'
								name='oauthKey'
								value={formData.oauthKey}
								onChange={handleInputChange}
							/>
							<span
								className={`question-icon ${
									showTooltip === 'oauthKey' ? 'active-icon' : ''
								}`}
								onClick={() =>
									setShowTooltip(showTooltip === 'oauthKey' ? null : 'oauthKey')
								}
							>
								?
							</span>
						</div>
						<div className='form-field'>
							<label htmlFor='serato-display-name'>Serato Display Name:</label>
							<input
								type='text'
								id='serato-display-name'
								name='seratoDisplayName'
								value={formData.seratoDisplayName}
								onChange={handleInputChange}
							/>
							<span
								className={`question-icon ${
									showTooltip === 'seratoDisplayName' ? 'active-icon' : ''
								}`}
								onClick={() =>
									setShowTooltip(
										showTooltip === 'seratoDisplayName'
											? null
											: 'seratoDisplayName'
									)
								}
							>
								?
							</span>
						</div>

						<div className='form-field'>
							<label htmlFor='obs-websocket-address'>
								OBS Websocket Address:
							</label>
							<input
								type='text'
								id='obs-websocket-address'
								name='obsWebsocketAddress'
								value={formData.obsWebsocketAddress}
								onChange={handleInputChange}
								placeholder='optional'
							/>
							<span
								className={`question-icon ${
									showTooltip === 'obsWebsocketAddress' ? 'active-icon' : ''
								}`}
								onClick={() =>
									setShowTooltip(
										showTooltip === 'obsWebsocketAddress'
											? null
											: 'obsWebsocketAddress'
									)
								}
							>
								?
							</span>
						</div>
						<div className='form-field'>
							<label htmlFor='obs-websocket-password'>
								OBS Websocket Password:
							</label>
							<input
								type='text'
								id='obs-websocket-password'
								name='obsWebsocketPassword'
								value={formData.obsWebsocketPassword}
								onChange={handleInputChange}
								placeholder='optional'
							/>
							<span
								className={`question-icon ${
									showTooltip === 'obsWebsocketPassword' ? 'active-icon' : ''
								}`}
								onClick={() =>
									setShowTooltip(
										showTooltip === 'obsWebsocketPassword'
											? null
											: 'obsWebsocketPassword'
									)
								}
							>
								?
							</span>
						</div>
						<div className='button-row'>
							<button type='submit'>Submit</button>
							<button type='submit'>Update</button>
						</div>
					</form>
				</div>
				<div className='app-container-column'>
					<div className='app-form-title'>Preferences:</div>

					<div className='toggle-field obs-prefs-element'>
						<input
							type='checkbox'
							id='obsResponseToggle'
							checked={isObsResponseEnabled}
							disabled={
								!(formData.obsWebsocketAddress && formData.obsWebsocketPassword)
							}
							onChange={() => setIsObsResponseEnabled(!isObsResponseEnabled)}
						/>
						<label
							htmlFor='obsResponseToggle'
							className={!isObsResponseEnabled ? 'disabled-label' : ''}
						>
							Enable On-Screen OBS Responses
						</label>
					</div>

					<div className='form-field'>
						<label
							htmlFor='obs-clear-display-time'
							className={!isObsResponseEnabled ? 'disabled-label' : ''}
						>
							On-screen display time:
						</label>

						<input
							type='text'
							id='obs-clear-display-time'
							name='obsClearDisplayTime' // You might want to change this name to match its purpose, e.g., 'intervalDuration'
							value={formData.obsClearDisplayTime} // Again, you might want to update this to formData.intervalDuration
							onChange={handleInputChange}
							placeholder='enter time in seconds'
							disabled={!isObsResponseEnabled}
						/>
						<span
							className={`question-icon ${
								showTooltip === 'obsClearDisplayTime' ? 'active-icon' : ''
							}`}
							onClick={() =>
								setShowTooltip(
									showTooltip === 'obsClearDisplayTime'
										? null
										: 'obsClearDisplayTime'
								)
							}
						>
							?
						</span>
					</div>

					<div className='toggle-field interval-prefs-element'>
						<input
							type='checkbox'
							id='intervalMessageToggle'
							checked={isIntervalEnabled}
							onChange={() => setIsIntervalEnabled(!isIntervalEnabled)}
						/>

						<label
							htmlFor='intervalMessageToggle'
							className={!isIntervalEnabled ? 'disabled-label' : ''}
						>
							Enable Interval Messages
						</label>
					</div>
					<div className='form-field'>
						<label
							htmlFor='obs-interval-duration'
							className={!isIntervalEnabled ? 'disabled-label' : ''}
						>
							Interval Duration:
						</label>

						<input
							type='text'
							id='obs-interval-duration'
							name='obsIntervalDuration' // You might want to change this name to match its purpose, e.g., 'intervalDuration'
							value={formData.obsIntervalDuration} // Again, you might want to update this to formData.intervalDuration
							onChange={handleInputChange}
							placeholder='enter time in minutes'
							disabled={!isIntervalEnabled}
						/>
						<span
							className={`question-icon ${
								showTooltip === 'obsIntervalDuration' ? 'active-icon' : ''
							}`}
							onClick={() =>
								setShowTooltip(
									showTooltip === 'obsIntervalDuration'
										? null
										: 'obsIntervalDuration'
								)
							}
						>
							?
						</span>
					</div>
					<div className='toggle-field report-prefs-element'>
						<input
							type='checkbox'
							id='sendReportToggle'
							checked={isReportEnabled}
							onChange={() => setIsReportEnabled(!isReportEnabled)}
						/>

						<label
							htmlFor='sendReportToggle'
							className={!isReportEnabled ? 'disabled-label' : ''}
						>
							Send Post-Stream Report
						</label>
					</div>
					<div className='form-field'>
						<label
							htmlFor='is-report-enabled'
							className={!isReportEnabled ? 'disabled-label' : ''}
						>
							Email Address:
						</label>

						<input
							type='text'
							id='is-report-enabled'
							name='userEmailAddress' // You might want to change this name to match its purpose, e.g., 'intervalDuration'
							value={formData.userEmailAddress} // Again, you might want to update this to formData.intervalDuration
							onChange={handleInputChange}
							placeholder=''
							disabled={!isReportEnabled}
						/>
						<span
							className={`question-icon ${
								showTooltip === 'userEmailAddress' ? 'active-icon' : ''
							}`}
							onClick={() =>
								setShowTooltip(
									showTooltip === 'userEmailAddress' ? null : 'userEmailAddress'
								)
							}
						>
							?
						</span>
					</div>
				</div>

				<div className='app-container-column'>
					{/* <div className='app-form-title'>Information:</div> */}
					<div className='app-form-title start-chatbot'>Chatbot Controls:</div>
					<div>
						<button className='bot-control-button' type='submit'>
							Connect
						</button>
						<button className='bot-control-button' type='submit'>
							End Session
						</button>
					</div>
					<div className='app-form-title session-info'>Session Info:</div>
					<div className='session-info-label'>
						Status:<span className='session-info-status'>not connected</span>
					</div>
					<div className='session-info-label'>
						Uptime:<span className='session-info-status'>x hours & x mins</span>
					</div>
				</div>
			</div>
			<div className='message-panel'>
				<div className='app-form-title'>More Info:</div>
				{message && <div className='success-message'>{message}</div>}
				{error && <div className='error-message'>{error}</div>}
				{showTooltip === 'twitchChannelName' && (
					<div className='info-tooltip'>
						Enter your primary Twitch channel's name here
					</div>
				)}
				{showTooltip === 'twitchChatbotName' && (
					<div className='info-tooltip'>
						Enter the your Twitch channel's chatbot name here. More details can
						be found{' '}
						<a
							href='https://np-chatbot-site.web.app/'
							rel='noreferrer'
							target='_blank'
						>
							here
						</a>
					</div>
				)}
				{showTooltip === 'oauthKey' && (
					<div className='info-tooltip'>
						Enter the OAuth key that you previously generated for your Twitch
						channel here
					</div>
				)}
				{showTooltip === 'seratoDisplayName' && (
					<div className='info-tooltip'>
						Enter the display name from your Serato playlist page here
					</div>
				)}
				{showTooltip === 'obsIntervalDuration' && (
					<div className='info-tooltip'>
						Enter the duration (in minutes) for your interval messages to appear
					</div>
				)}
				{showTooltip === 'obsWebsocketAddress' && (
					<div className='info-tooltip'>
						Enter your local OBS web socket address here
					</div>
				)}
				{showTooltip === 'obsWebsocketPassword' && (
					<div className='info-tooltip'>
						If your web socket connection is secured within OBS, please enter
						the password here (optional)
					</div>
				)}
				{showTooltip === 'userEmailAddress' && (
					<div className='info-tooltip'>
						Enter the email address that you'd like your post-stream report send
						to
					</div>
				)}
			</div>
		</div>
	)
}

export default App
