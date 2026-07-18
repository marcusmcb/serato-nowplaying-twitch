const handleSubmit = async (
	event: React.FormEvent<HTMLFormElement>,
	formData: any,
	addMessageToQueue: (message: string) => void,
	setCurrentMessage: (message: string) => void,
	setError: (error: string) => void,
	setFormData: (data: any) => void,
	commitInitial: (nextFormData?: any, nextPreferences?: any) => void,
	isIntervalEnabled: boolean,
	isObsResponseEnabled: boolean,
	isSpotifyEnabled: boolean,
	isAutoIDEnabled: boolean,
	isAutoIDCleanupEnabled: boolean,
	isAutoIDDelayEnabled: boolean,
	autoIDDelaySeconds: number,
	continueLastPlaylist: boolean
) => {
	setError('')
	event.preventDefault()
	console.log('--- Form Data Submitted ---')
	console.log(formData)
	console.log('---------------------------')
	if (
		!formData.twitchChannelName ||
		!formData.twitchChatbotName ||
		!formData.seratoDisplayName
	) {
		setError('Please fill in all required fields before updating.')
		setTimeout(() => {
			setError('')
		}, 3000)
		return
	}
	addMessageToQueue('Updating...')
	if (isIntervalEnabled && formData.intervalMessageDuration === '') {
		formData.intervalMessageDuration = '15'
	}
	if (isObsResponseEnabled && formData.obsClearDisplayTime === '') {
		formData.obsClearDisplayTime = '5'
	}

	const submitData = {
		...formData,
		isObsResponseEnabled,
		isIntervalEnabled,
		isSpotifyEnabled,
		isAutoIDEnabled,
		isAutoIDCleanupEnabled,
		isAutoIDDelayEnabled,
		autoIDDelaySeconds,
		continueLastPlaylist,
	}

	const response = await window.electron.submitUserData(submitData)
	console.log(response)
	if (response && response.success) {
		addMessageToQueue(response.message)
		const nextForm = {
			...response.data,
			// ensure text inputs remain strings
			intervalMessageDuration: String(
				response.data.intervalMessageDuration ?? ''
			),
			obsClearDisplayTime: String(response.data.obsClearDisplayTime ?? ''),
		}
		setFormData(nextForm)
		// Commit new snapshots in context on successful save
		commitInitial(
			nextForm,
			{
				isObsResponseEnabled: !!response.data.isObsResponseEnabled,
				isIntervalEnabled: !!response.data.isIntervalEnabled,
				isReportEnabled: !!response.data.isReportEnabled,
				isSpotifyEnabled: !!response.data.isSpotifyEnabled,
				isAutoIDEnabled: !!response.data.isAutoIDEnabled,
				isAutoIDCleanupEnabled: !!response.data.isAutoIDCleanupEnabled,
				isAutoIDDelayEnabled: !!response.data.isAutoIDDelayEnabled,
				autoIDDelaySeconds: Number(
					response.data.autoIDDelaySeconds ?? 0
				),
				continueLastPlaylist: !!response.data.continueLastPlaylist,
				obsClearDisplayTime: Number(
					response.data.obsClearDisplayTime ?? 0
				),
				intervalMessageDuration: Number(
					response.data.intervalMessageDuration ?? 0
				),
			}
		)
		// isConnectionReady is derived from formData in context; no setter needed here
	} else if (response && response.error) {
		console.log('Update error: ', response.error)
		setCurrentMessage('')
		setError(response.error)
		setTimeout(() => {
			setError('')
		}, 5000)
	} else {
		console.log('Unexpected response when updating preferences')
	}
}

export default handleSubmit
