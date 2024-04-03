import '../App.css'

// add logic to handle any errors returned
// during the initial app authorization
// on the app's client UI

const ipcRenderer = window.electron.ipcRenderer

interface TitleBarProps {
	isAuthorized: boolean
}

const TitleBar = ({ isAuthorized }: TitleBarProps): JSX.Element => {
	const handleAuthClick = () => {
		ipcRenderer.send('open-auth-url')
	}
	return (
		<div>
			<div className='app-title'>npChatbot App</div>
			<button disabled={isAuthorized} onClick={handleAuthClick}>
				{isAuthorized ? 'Authorized' : 'Connect with Twitch'}
			</button>
		</div>
	)
}

export default TitleBar
