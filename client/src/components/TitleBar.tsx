import '../App.css'

// add logic to handle any errors returned
// during the initial app authorization
// on the app's client UI

const TitleBar = (): JSX.Element => {
	const handleAuthClick = () => {
		window.location.href =
			'https://id.twitch.tv/oauth2/authorize?response_type=code&client_id=19evlkrdxmriyliiey2fhhhxd8kkl6&redirect_uri=http://localhost:5000/auth/twitch/callback&scope=chat:read+chat:edit&state=c3ab8aa609ea11e793ae92361f002671'
	}
	return (
		<div>
			<div className='app-title'>npChatbot App</div>
			<button onClick={handleAuthClick}>Connect with Twitch</button>
		</div>
	)
}

export default TitleBar
