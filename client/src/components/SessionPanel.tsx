import React, { useState, useEffect } from 'react'
import '../App.css'

interface SessionPanelProps {
	handleConnect: (event: React.MouseEvent<HTMLButtonElement>) => void
	handleDisconnect: (event: React.MouseEvent<HTMLButtonElement>) => void
	isBotConnected: boolean
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
					onClick={(event) => {
						resetUptime();
						props.handleDisconnect(event);
				}}
				>
					End Session
				</button>
			</div>
			<div className='app-form-title session-info'>Session Info:</div>
			<div className='session-info-label'>
				Status:
				<span className='session-info-status'>
					{props.isBotConnected ? 'connected' : 'not connected'}
				</span>
			</div>
			<div className='session-info-label'>
				Uptime:
				<span className='session-info-status'>
					{hours > 0 ? `${hours} hours, ` : ''} {minutes > 0 ? `${minutes} mins, ` : ''} {seconds > 0 ? `${seconds} secs` : ''}
				</span>
			</div>
		</div>
	)
}

export default SessionPanel
