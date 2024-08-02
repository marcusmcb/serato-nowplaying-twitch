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
	return (
		<div className='message-panel'>
			<div className='app-form-title'>More Info:</div>
			{message && <div className='success-message'>{message}</div>}
			{error && <div className='error-message'>{error}</div>}
			{showTooltip === 'twitchChannelName' && (
				<div className='info-tooltip'>
					{tooltipTexts.twitchChannelName}
				</div>
			)}
			{showTooltip === 'twitchChatbotName' && (
				<div className='info-tooltip'>
					{tooltipTexts.twitchChatbotName}
				</div>
			)}
			{showTooltip === 'obsClearDisplayTime' && (
				<div className='info-tooltip'>
					{tooltipTexts.obsClearDisplayTime}
				</div>
			)}
			{showTooltip === 'seratoDisplayName' && (
				<div className='info-tooltip'>
					{tooltipTexts.seratoDisplayName}
				</div>
			)}
			{showTooltip === 'intervalMessageDuration' && (
				<div className='info-tooltip'>
					{tooltipTexts.intervalMessageDuration}
				</div>
			)}
			{showTooltip === 'obsWebsocketAddress' && (
				<div className='info-tooltip'>
					{tooltipTexts.obsWebsocketAddress}
				</div>
			)}
			{showTooltip === 'obsWebsocketPassword' && (
				<div className='info-tooltip'>
					{tooltipTexts.obsWebsocketPassword}
				</div>
			)}
			{showTooltip === 'userEmailAddress' && (
				<div className='info-tooltip'>
					{tooltipTexts.userEmailAddress}
				</div>
			)}
		</div>
	)
}

export default MessagePanel
