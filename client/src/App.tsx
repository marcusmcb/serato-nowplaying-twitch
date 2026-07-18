import React, { useState, useEffect } from 'react'
import TitleBar from './components/TitleBar'
import CredentialsPanel from './components/CredentialsPanel'
import PreferencesPanel from './components/PreferencesPanel'
import SessionPreferencesPanel from './components/SessionPreferencesPanel'
import SessionPanel from './components/SessionPanel'
import MessagePanel from './components/MessagePanel'
import ReportViewer from './components/ReportViewer'

import { BotProcessResponse, AuthSuccess } from './types'
import { ReportData } from './types'

import useWebSocket from './hooks/useWebSocket'
import useGetPlaylistData from './hooks/useGetPlaylistData'
import useMessageQueue from './hooks/useMessageQueue'
import useTooltipVisibility from './hooks/useTooltipVisibility'
import fetchPlaylistSummaries from './utils/fetchPlaylistSummaries'
import { useUserContext } from './context/UserContext'

import handleConnect from './utils/handleConnect'
import handleDisconnect from './utils/handleDisconnect'
import handleSubmit from './utils/handleSubmit'
import validateLivePlaylist from './utils/validateLivePlaylist'

import './App.css'

const App = (): JSX.Element => {
	const userContext = useUserContext()

	// useEffect(() => {
	// 	console.log('User Context in App.tsx: ', userContext)
	// }, [userContext])

	const {
		isObsResponseEnabled,
		isIntervalEnabled,
		isSpotifyEnabled,
		isAutoIDEnabled,
		isAutoIDCleanupEnabled,
		isAutoIDDelayEnabled,
		autoIDDelaySeconds,
		continueLastPlaylist,
		setIsTwitchAuthorized,
		setIsSpotifyAuthorized,
		isDiscordAuthorized,
		setIsDiscordAuthorized,		
		formData,
		setFormData,		
		commitInitial,
	} = userContext

	/* STATE VALUES */

	const [error, setError] = useState('')
	const [showTooltip, setShowTooltip] = useState<string | null>(null)
	const [isBotConnected, setIsBotConnected] = useState(false)
	const [messageQueue, setMessageQueue] = useState<string[]>([])
	const [currentMessage, setCurrentMessage] = useState<string | null>(null)

	const [isReportReady, setIsReportReady] = useState(false)
	const [reportData, setReportData] = useState<ReportData | null>(null)
	const [reportView, setReportView] = useState(false)
	const [playlistSummaries, setPlaylistSummaries] = useState<ReportData[]>([])
	const [currentReportIndex, setCurrentReportIndex] = useState(0)

	const ipcRenderer = window.electron.ipcRenderer

	/* CLIENT UI HELPER METHODS */

	// helper to add user response messages to message queue
	const addMessageToQueue = (newMessage: string) => {
		if (newMessage !== undefined) {
			setMessageQueue((prevQueue) => [...prevQueue, newMessage])
		} else return
	}



	/* EFFECT HOOKS */

	// hook for to listen for successful authorization callbacks
	useWebSocket(
		'ws://localhost:8080',
		(event) => {
			console.log('Message from server: ', event.data)
			addMessageToQueue(event.data)
			if (
				event.data === 'npChatbot successfully linked to your Twitch account'
			) {
				console.log('**** Twitch Auth Successful ****')
				setIsTwitchAuthorized(true)
			}
			if (
				event.data === 'npChatbot successfully linked to your Spotify account'
			) {
				console.log('**** Spotify Auth Successful ****')
				setIsSpotifyAuthorized(true)
			}
			if (
				event.data === 'npChatbot successfully linked to your Discord channel'
			) {
				console.log('**** Discord Auth Successful ****')
				setIsDiscordAuthorized(true)
			}
		},
		() => {
			// console.log('WebSocket is open now.')
		},
		(event) => {
			console.error('WebSocket error:', event)
		}
	)

	// hook to listen for Spotify update messages
	useWebSocket(
		'ws://localhost:8081',
		(event) => {
			console.log('Spotify Message from server: ', event.data)
			addMessageToQueue(event.data)
		},
		() => {
			console.log('Spotify WebSocket is open now.')
		},
		(event) => {
			console.error('Spotify WebSocket error:', event)
		}
	)

	// hook to handle tooltip visibility
	useTooltipVisibility(showTooltip, setShowTooltip)

	// hook to handle user response messages in the UI via message queue
	useMessageQueue(
		messageQueue,
		setMessageQueue,
		currentMessage,
		setCurrentMessage
	)

	// hook to fetch playlist summaries and set initial report index
	useGetPlaylistData(
		currentReportIndex,
		setPlaylistSummaries,
		setCurrentReportIndex,
		setReportData,
		setIsReportReady
	)	

	// hook to update report data when current report index changes
	useEffect(() => {
		if (playlistSummaries.length > 0) {
			setReportData(playlistSummaries[currentReportIndex])
		}
	}, [currentReportIndex, playlistSummaries])

	// Dev-only: log reportData whenever it changes (and mirror to main)
	useEffect(() => {
		if (process.env.NODE_ENV !== 'development') return
		if (reportData) {
			const payload = {
				source: 'App',
				msg: 'reportData updated',
				index: currentReportIndex,
				reportData,
			}
			console.log('[ReportData]', {
				index: currentReportIndex,
				reportData,
			})
			try {
				window.electron.ipcRenderer.send('renderer-log', payload)
			} catch {}
		}
	}, [reportData, currentReportIndex])

	// hook to initially set user id in state
	// once the app has been authorized via Twitch
	useEffect(() => {
		const handleAuthSuccess = (response: AuthSuccess) => {
			console.log('Auth success:', response)
			// Only set the user id and mark Twitch as authorized. Tokens are stored in the OS keystore and not exposed to the renderer.
			setFormData({ _id: response._id })
			setIsTwitchAuthorized(true)
		}
		window.electron.ipcRenderer.on('auth-successful', handleAuthSuccess)
		return () => {
			window.electron.ipcRenderer.removeAllListeners('authSuccess')
		}
	}, [])

	// hook to handle error messages from bot process
	useEffect(() => {
		const handleBotProcessData = (response: BotProcessResponse) => {
			console.log('Data from botProcess:', response)
			addMessageToQueue(response.message)
		}
		window.electron.ipcRenderer.on('botProcessResponse', handleBotProcessData)
		return () => {
			window.electron.ipcRenderer.removeAllListeners('botProcessResponse')
		}
	}, [])

	// method to validate that the user's Serato Live Playlist
	// is public and can be accessed by npChatbot
	const validateLivePlaylistWrapper = async (
		event: React.MouseEvent<HTMLButtonElement>
	) => {
		validateLivePlaylist(
			event,
			formData,
			ipcRenderer,
			addMessageToQueue,
			setError
		)
	}

	// handle npChatbot script connection
	const handleConnectWrapper = async (
		event: React.MouseEvent<HTMLButtonElement>
	) => {
		handleConnect(
			event,
			formData,
			ipcRenderer,
			addMessageToQueue,
			setIsBotConnected,
			setError
		)
	}

	// handle npChatbot script disconnection
	const handleDisconnectWrapper = (
		event: React.MouseEvent<HTMLButtonElement>
	) => {
		handleDisconnect(
			event,
			ipcRenderer,
			formData,
			setReportData,
			setIsReportReady,
			addMessageToQueue,
			setIsBotConnected,
			setPlaylistSummaries,
			setCurrentReportIndex,
			setError
		)
	}

	// handle user credentials and preferences submission
	const handleSubmitWrapper = async (
		event: React.FormEvent<HTMLFormElement>
	) => {
		handleSubmit(
			event,
			formData,
			ipcRenderer,
			addMessageToQueue,
			setCurrentMessage,
			setError,
			(data: any) => setFormData(data),
			commitInitial,
			isIntervalEnabled,
			isObsResponseEnabled,
			isSpotifyEnabled,
			isAutoIDEnabled,
			isAutoIDCleanupEnabled,
			isAutoIDDelayEnabled,
			autoIDDelaySeconds,
			continueLastPlaylist
		)
		// commitInitial will be called inside handleSubmit on success
	}

	// helper method to reload playlist summaries
	// and reset current report index when a playlist is deleted
	const reloadPlaylistSummaries = (deletedIndex: number) => {
		fetchPlaylistSummaries().then((playlistSummary) => {
			if (playlistSummary && playlistSummary.length > 0) {
				setPlaylistSummaries(playlistSummary as ReportData[])
				const newIndex = deletedIndex > 0 ? deletedIndex - 1 : 0
				setCurrentReportIndex(newIndex)
				setReportData(playlistSummary[newIndex] as ReportData)
				setIsReportReady(true)
			} else {
				setPlaylistSummaries([])
				setCurrentReportIndex(0)
				setReportData(null)
				setIsReportReady(false)
			}
		})
	}

	return (
		<div className='App'>
			<div className='top-panel'>
				{reportView ? (
					<></>
				) : (
					<>
						<TitleBar isBotConnected={isBotConnected} />
						<MessagePanel
							message={currentMessage || ''}
							error={error}
							showTooltip={showTooltip}
						/>
					</>
				)}
			</div>
			<div className='content-panel'>
				{reportView ? (
					<div className='app-container'>
						<div className='main-report-panel'>
							<ReportViewer
								reportData={reportData}
								setReportView={setReportView}
								playlistSummaries={playlistSummaries}
								currentReportIndex={currentReportIndex}
								setCurrentReportIndex={setCurrentReportIndex}
								reloadPlaylistSummaries={reloadPlaylistSummaries}
								isDiscordAuthorized={isDiscordAuthorized}
							/>
						</div>
					</div>
				) : (
					<div className='app-container'>
						<div className='main-layout'>
							<div className='left-col'>
								<CredentialsPanel
									showTooltip={showTooltip}
									setShowTooltip={setShowTooltip}
									handleSubmit={handleSubmitWrapper}
									isBotConnected={isBotConnected}
								/>
							</div>

							<div className='right-col'>
								<div className='right-top'>
									<div className='prefs-col'>
										<PreferencesPanel
											showTooltip={showTooltip}
											setShowTooltip={setShowTooltip}
											isBotConnected={isBotConnected}
										/>
									</div>
									<div className='session-prefs-col'>
										<SessionPreferencesPanel
											showTooltip={showTooltip}
											setShowTooltip={setShowTooltip}
											isBotConnected={isBotConnected}
										/>
									</div>
								</div>

								<div className='right-bottom'>
									<SessionPanel
										handleConnect={handleConnectWrapper}
										handleDisconnect={handleDisconnectWrapper}
										isBotConnected={isBotConnected}
										reportData={reportData || ({} as ReportData)}
										isReportReady={isReportReady}
										setReportView={setReportView}
										reportView={reportView}
										validateLivePlaylist={validateLivePlaylistWrapper}
										playlistSummaries={playlistSummaries}
										currentReportIndex={currentReportIndex}
										setCurrentReportIndex={setCurrentReportIndex}
										reloadPlaylistSummaries={reloadPlaylistSummaries}
										setPlaylistSummaries={setPlaylistSummaries}
									/>
								</div>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	)
}

export default App
