import '../App.css'

// add logic to handle any errors returned
// during the initial app authorization
// on the app's client UI

const ipcRenderer = window.electron.ipcRenderer

interface TitleBarProps {
	isAuthorized: boolean
	isBotConnected: boolean
}

const TitleBar = ({ isAuthorized, isBotConnected }: TitleBarProps): JSX.Element => {
	const handleAuthClick = () => {
		ipcRenderer.send('open-auth-url')
	}
	return (
		<div>
			<div className='app-title'>npChatbot App</div>
			<button onClick={handleAuthClick} disabled={isBotConnected}>
				{isAuthorized ? 'Reauthorize' : 'Connect with Twitch'}
			</button>
		</div>
	)
}

export default TitleBar
