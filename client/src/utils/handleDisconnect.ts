import { ReportData } from '../types'
import fetchPlaylistSummaries from './fetchPlaylistSummaries'

const handleDisconnect = async (
	formData: any,
	setReportData: (data: ReportData | null) => void,
	setIsReportReady: (ready: boolean) => void,
	addMessageToQueue: (message: string) => void,
	setIsBotConnected: (connected: boolean) => void,
	setPlaylistSummaries: (summaries: ReportData[]) => void,
	setCurrentReportIndex: (index: number) => void
) => {
	console.log('*** npChatbot disconnect event ***')
	const stopBotResult = await window.electron.stopBotScript({
		seratoDisplayName: formData.seratoDisplayName,
	})

	if (stopBotResult && stopBotResult.success) {
		addMessageToQueue('npChatbot has been disconnected from Twitch.')
		setIsBotConnected(false)
	} else if (stopBotResult && stopBotResult.error) {
		console.log('Disconnection error: ', stopBotResult.error)
		addMessageToQueue(stopBotResult.error)
	} else {
		console.log('Unexpected response from stop-bot-script')
	}

	console.log('stopBotResponse received:', stopBotResult)

	// Now fetch playlist summaries after stopBotScript has completed
	const playlistSummaries = await fetchPlaylistSummaries()
	console.log('Fetched playlist summaries:', playlistSummaries)
	console.log("*****************************************************")
	if (playlistSummaries && playlistSummaries.length > 0) {
		setPlaylistSummaries(playlistSummaries)
		setCurrentReportIndex(0)
		setReportData(playlistSummaries[0] as ReportData)
		setIsReportReady(true)
	} else {
		setPlaylistSummaries([])
		setCurrentReportIndex(0)
		setReportData(null)
		setIsReportReady(false)
	}
}

export default handleDisconnect