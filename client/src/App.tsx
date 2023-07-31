import React, { useState, useEffect } from 'react'
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
	})

	const [error, setError] = useState('')
	const [message, setMessage] = useState('')

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = event.target
		setFormData((prevFormData) => ({ ...prevFormData, [name]: value }))
	}

	const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
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
		setTimeout(() => {
			setMessage('')
		}, 3000)
	}

	// Manage the state to enable/disable obsResponseToggle
	const [isObsResponseEnabled, setIsObsResponseEnabled] = useState(false)
	const [isIntervalEnabled, setIsIntervalEnabled] = useState(false)
	const [showTooltip, setShowTooltip] = useState<string | null>(null)

	// useEffect to update isObsResponseEnabled when obsWebsocketAddress and obsWebsocketPassword are filled
	useEffect(() => {
		setIsObsResponseEnabled(
			!!formData.obsWebsocketAddress && !!formData.obsWebsocketPassword
		)
	}, [formData.obsWebsocketAddress, formData.obsWebsocketPassword])

	return (
		<div className='App'>
			<div className='app-title'>npChatbot App</div>
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
								className='question-icon'
								onMouseEnter={() => setShowTooltip('twitchChannelName')}
								onMouseLeave={() => setShowTooltip(null)}
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
								className='question-icon'
								onMouseEnter={() => setShowTooltip('twitchChatbotName')}
								onMouseLeave={() => setShowTooltip(null)}
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
								className='question-icon'
								onMouseEnter={() => setShowTooltip('oauthKey')}
								onMouseLeave={() => setShowTooltip(null)}
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
								className='question-icon'
								onMouseEnter={() => setShowTooltip('seratoDisplayName')}
								onMouseLeave={() => setShowTooltip(null)}
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
							className='question-icon'
							onMouseEnter={() => setShowTooltip('obsIntervalDuration')}
							onMouseLeave={() => setShowTooltip(null)}
						>
							?
						</span>
					</div>

					<div className='toggle-field obs-prefs-element'>
						<input
							type='checkbox'
							id='obsResponseToggle'
							disabled={!isObsResponseEnabled}
						/>
						<label
							htmlFor='obsResponseToggle'
							className={!isObsResponseEnabled ? 'disabled-label' : ''}
						>
							Enable On-Screen OBS Responses
						</label>
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
							className='question-icon'
							onMouseEnter={() => setShowTooltip('obsWebsocketAddress')}
							onMouseLeave={() => setShowTooltip(null)}
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
							className='question-icon'
							onMouseEnter={() => setShowTooltip('obsWebsocketPassword')}
							onMouseLeave={() => setShowTooltip(null)}
						>
							?
						</span>
					</div>
					<div className='app-form-title start-chatbot'>Start Chatbot:</div>
					<button type='submit'>Start</button>
				</div>
				<div className='app-container-column'>
					<div className='app-form-title'>Information:</div>
					{showTooltip === 'twitchChannelName' && (
						<div className='info-tooltip'>
							More info about Twitch Channel Name
						</div>
					)}

					{showTooltip === 'twitchChatbotName' && (
						<div className='info-tooltip'>
							More info about Twitch Chatbot Name
						</div>
					)}
					{showTooltip === 'oauthKey' && (
						<div className='info-tooltip'>More info about Twitch oAuth Key</div>
					)}
					{showTooltip === 'seratoDisplayName' && (
						<div className='info-tooltip'>
							More info about Serato Display Name
						</div>
					)}
					{showTooltip === 'obsIntervalDuration' && (
						<div className='info-tooltip'>
							More info about OBS interval duration
						</div>
					)}
					{showTooltip === 'obsWebsocketAddress' && (
						<div className='info-tooltip'>
							More info about OBS web socket address
						</div>
					)}
					{showTooltip === 'obsWebsocketPassword' && (
						<div className='info-tooltip'>
							More info about OBS web socket password
						</div>
					)}
					<div className='app-info-panel'>
						Display information about the chatbot stream here
					</div>
				</div>
			</div>
			<div className='message-panel'>
				{message && <div className='success-message'>{message}</div>}
				{error && <div className='error-message'>{error}</div>}
			</div>
		</div>
	)
}

export default App
