import React from 'react'
import './App.css'

function App() {
	return (
		<div className='App'>
			<div className='app-title'>npChatbot App</div>
			<div className='app-container'>
				<div className='app-container-column'>
					<div className='app-form-title'>Enter your credentials below:</div>
					<form className='app-form'>
						<div className='form-field'>
							<label htmlFor='twitch-channel-name'>Twitch Channel Name:</label>
							<input
								type='text'
								id='twitch-channel-name'
								name='twitch-channel-name'
							/>
						</div>
						<div className='form-field'>
							<label htmlFor='twitch-chatbot-name'>Twitch Chatbot Name:</label>
							<input
								type='twitch-chatbot-name'
								id='twitch-chatbot-name'
								name='twitch-chatbot-name'
							/>
						</div>
						<div className='form-field'>
							<label htmlFor='oauth-key'>Twitch OAuth Key:</label>
							<input type='text' id='oauth-key' name='oauth-key' />
						</div>
						<div className='form-field'>
							<label htmlFor='serato-display-name'>Serato Display Name:</label>
							<input
								type='text'
								id='serato-display-name'
								name='serato-display-name'
							/>
						</div>
						<div className='button-row'>
							<button type='submit'>Submit</button>
							<button type='submit'>Update</button>
						</div>
					</form>
				</div>
				<div className='app-container-column'>
					<div className='app-form-title'>Preferences:</div>
					<div className='toggle-field'>
						<input type='checkbox' id='toggleSwitch1' />
						<label htmlFor='toggleSwitch1'>Enable Interval Messages</label>
					</div>
					<div className='toggle-field'>
						<input type='checkbox' id='toggleSwitch2' />
						<label htmlFor='toggleSwitch2'>
							Enable On-Screen OBS Responses
						</label>
					</div>
					<div className='app-form-title start-chatbot'>Start Chatbot:</div>
					<button type='submit'>Start</button>
				</div>
			</div>
		</div>
	)
}

export default App
