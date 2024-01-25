import '../App.css'
import axios from 'axios'

const TitleBar = (): JSX.Element => {
	const getAuthToken = async () => {
		try {
		} catch (error) {
			console.error('ERROR: ', error)
		}
	}

	const handleClick = () => {}

	return (
		<div>
			<div className='app-title'>npChatbot App</div>
			<button>
				<a href='https://id.twitch.tv/oauth2/authorize?response_type=code&client_id=19evlkrdxmriyliiey2fhhhxd8kkl6&redirect_uri=http://localhost:3000&scope=channel%3Amanage%3Apolls+channel%3Aread%3Apolls&state=c3ab8aa609ea11e793ae92361f002671'>
					Connect with Twitch
				</a>
			</button>
		</div>
	)
}

export default TitleBar
