import '../App.css'
import tooltipTexts from './tooltips/tooltipTexts'

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
	// Function to get the tooltip content
	const getTooltipContent = (key: string) => {
		switch (key) {
			case 'twitchChannelName':
				return tooltipTexts.twitchChannelName
			case 'twitchChatbotName':
				return tooltipTexts.twitchChatbotName
			case 'obsClearDisplayTime':
				return tooltipTexts.obsClearDisplayTime
			case 'seratoDisplayName':
				return tooltipTexts.seratoDisplayName
			case 'intervalMessageDuration':
				return tooltipTexts.intervalMessageDuration
			case 'obsWebsocketAddress':
				return tooltipTexts.obsWebsocketAddress
			case 'obsWebsocketPassword':
				return tooltipTexts.obsWebsocketPassword
			case 'userEmailAddress':
				return tooltipTexts.userEmailAddress
			default:
				return ''
		}
	}

	return (
		<div className='message-panel'>
			<div className='app-form-title'>More Info:</div>
			{message && <div className='success-message'>{message}</div>}
			{error && <div className='error-message'>{error}</div>}
			{showTooltip && (
				<div
					className='info-tooltip'
					dangerouslySetInnerHTML={{ __html: getTooltipContent(showTooltip) }} // Render HTML safely
				/>
			)}
		</div>
	)
}

export default MessagePanel
