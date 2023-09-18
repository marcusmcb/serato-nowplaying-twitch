import '../App.css'

interface MessagePanelProps {
	message: string
	error: string
	showTooltip: string | null
}

const MessagePanel: React.FC<MessagePanelProps> = ({
	message,
	error,
	showTooltip,
}) => {
	return (
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
					Enter the your Twitch channel's chatbot name here. More details can be
					found{' '}
					<a
						href='https://np-chatbot-site.web.app/'
						rel='noreferrer'
						target='_blank'
					>
						here
					</a>
				</div>
			)}
			{showTooltip === 'twitchOAuthKey' && (
				<div className='info-tooltip'>
					Enter the OAuth key that you previously generated for your Twitch
					channel here
				</div>
			)}
			{showTooltip === 'obsClearDisplayTime' && (
				<div className='info-tooltip'>
					Enter the duration (in seconds) for the OBS response to remain on screen
				</div>
			)}
			{showTooltip === 'seratoDisplayName' && (
				<div className='info-tooltip'>
					Enter the display name from your Serato playlist page here
				</div>
			)}
			{showTooltip === 'intervalMessageDuration' && (
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
					If your web socket connection is secured within OBS, please enter the
					password here (optional)
				</div>
			)}
			{showTooltip === 'userEmailAddress' && (
				<div className='info-tooltip'>
					Enter the email address that you'd like your post-stream report send
					to
				</div>
			)}
		</div>
	)
}

export default MessagePanel
