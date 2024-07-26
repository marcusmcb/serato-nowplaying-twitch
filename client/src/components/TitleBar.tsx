import '../App.css'

const ipcRenderer = window.electron.ipcRenderer

interface TitleBarProps {
	isAuthorized: boolean
	isBotConnected: boolean
}

const TitleBar = ({
	isAuthorized,
	isBotConnected,
}: TitleBarProps): JSX.Element => {
	const handleAuthClick = () => {
		if (!isAuthorized) {
			ipcRenderer.send('open-auth-url')
		} else {
			console.log("Already authorized")
		}		
	}

	return (
		<div>
			<div className='app-title'>npChatbot App</div>
			<button
				onClick={handleAuthClick}
				disabled={isBotConnected}
				className={
					isAuthorized ? 'auth-button-authorized' : 'auth-button-default'
				}
			>
				{isAuthorized ? 'Authorized' : 'Authorize'}
			</button>
		</div>
	)
}

export default TitleBar
