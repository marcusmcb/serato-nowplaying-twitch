import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom'
import { ReportData } from '../types'
import ReportViewer from './ReportViewer'
import '../App.css'

// add logic to handle any errors returned
// during the Twitch IRC connection process
// in the client UI

// add logic to handle any disconnection
// events after initial connection
// in the client UI

interface SessionPanelProps {
	handleConnect: (event: React.MouseEvent<HTMLButtonElement>) => void
	handleDisconnect: (event: React.MouseEvent<HTMLButtonElement>) => void
	isBotConnected: boolean
	isAuthorized: boolean
	isConnectionReady: boolean
	isReportOpen: boolean
	reportData: ReportData | null
}

const openReportInNewWindow = (reportData: ReportData | null): void => {
	// Open a new window
	const reportWindow = window.open('', '_blank', 'width=800,height=600')

	if (!reportWindow) {
		console.error('Failed to open new window.')
		return
	}

	// Write the initial HTML structure for the new window
	reportWindow.document.write(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>npChatbot Final Report</title>
    </head>
    <body>
      <div id="root"></div>
    </body>
    </html>
  `)

	// Wait for the window to load its content before rendering
	reportWindow.onload = () => {
		if (reportWindow.document.getElementById('root')) {
			// Render the ReportViewer component into the new window's DOM
			ReactDOM.render(
				<React.StrictMode>
					<ReportViewer reportData={reportData} />
				</React.StrictMode>,
				reportWindow.document.getElementById('root')
			)
		}
	}
}

const SessionPanel: React.FC<SessionPanelProps> = (props) => {
	const [hours, setHours] = useState(0)
	const [minutes, setMinutes] = useState(0)
	const [seconds, setSeconds] = useState(0)

	const resetUptime = () => {
		setHours(0)
		setMinutes(0)
		setSeconds(0)
	}

	useEffect(() => {
		if (props.isReportOpen && props.reportData) {
			openReportInNewWindow(props.reportData)
		}
	}, [props.isReportOpen, props.reportData])

	useEffect(() => {
		let interval: NodeJS.Timeout

		if (props.isBotConnected) {
			interval = setInterval(() => {
				setSeconds((prevSeconds) => {
					if (prevSeconds === 59) {
						setMinutes((prevMinutes) => {
							if (prevMinutes === 59) {
								setHours((prevHours) => prevHours + 1)
								return 0
							}
							return prevMinutes + 1
						})
						return 0
					}
					return prevSeconds + 1
				})
			}, 1000)
		}

		// Cleanup interval on unmount or when bot disconnects
		return () => {
			if (interval) {
				clearInterval(interval)
			}
		}
	}, [props.isBotConnected])

	return (
		<div className='chatbot-controls'>
			<div className='app-form-title start-chatbot'>Chatbot Controls:</div>
			<div className='bot-control-button-panel'>
				<button
					className='bot-control-button'
					type='submit'
					onClick={props.handleConnect}
					disabled={
						props.isBotConnected ||
						!props.isAuthorized ||
						!props.isConnectionReady
					}
				>
					{!props.isBotConnected ? 'Connect' : 'Connected'}
				</button>
				<button
					className='bot-control-button'
					disabled={!props.isBotConnected}
					type='submit'
					onClick={(event) => {
						props.handleDisconnect(event)
						setTimeout(() => {
							resetUptime()
						}, 500)
					}}
				>
					End Session
				</button>
				{/* {props.isReportOpen && (
					<button
						className='bot-control-button'
						onClick={() => {
							openReportInNewWindow(props.reportData)
						}}
					>
						Report
					</button>
				)} */}
			</div>
			<div className='app-form-title session-info'>Session Info:</div>
			<div className='session-info-label'>
				Status:
				<span className='session-info-status'>
					{props.isBotConnected ? (
						<span style={{ color: 'lightgreen' }}>connected</span>
					) : (
						<span>not connected</span>
					)}
				</span>
			</div>
			<div className='session-info-label'>
				Uptime:
				<span className='session-info-status' style={{ color: 'lightgreen' }}>
					{hours > 0 ? `${hours} hours, ` : ''}{' '}
					{minutes > 0 ? `${minutes} mins, ` : ''}{' '}
					{seconds > 0 ? `${seconds} secs` : ''}
				</span>
			</div>
		</div>
	)
}

export default SessionPanel
