import '../App.css'

interface SessionPanelProps {
	handleConnect: (event: React.MouseEvent<HTMLButtonElement>) => void
	handleDisconnect: (event: React.MouseEvent<HTMLButtonElement>) => void
	isBotConnected: boolean
}

const SessionPanel: React.FC<SessionPanelProps> = (props) => {
	return (
		<div className='app-container-column'>
			<div className='app-form-title start-chatbot'>Chatbot Controls:</div>
			<div>
				<button
					className='bot-control-button'
					type='submit'
					onClick={props.handleConnect}
				>
					{!props.isBotConnected ? 'Connect' : 'Connected'}
				</button>
				<button
					className='bot-control-button'
					type='submit'
					onClick={props.handleDisconnect}
				>
					End Session
				</button>
			</div>
			<div className='app-form-title session-info'>Session Info:</div>
			<div className='session-info-label'>
				Status:<span className='session-info-status'>{props.isBotConnected ? 'connected' : 'not connected'}</span>
			</div>
			<div className='session-info-label'>
				Uptime:<span className='session-info-status'>x hours & x mins</span>
			</div>
		</div>
	)
}

export default SessionPanel
