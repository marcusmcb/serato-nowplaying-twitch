import React from 'react'
import '../App.css'
import './styles/preferencespanel.css'
import { useUserContext } from '../context/UserContext'

type SessionPreferencesPanelProps = {
	showTooltip: string | null
	setShowTooltip: (value: string | null) => void
	isBotConnected: boolean
}

const SessionPreferencesPanel: React.FC<SessionPreferencesPanelProps> = (props) => {
	const {
		formData,
		setFormData,
		isTwitchAuthorized,
		isObsResponseEnabled,
		setIsObsResponseEnabled,
		isIntervalEnabled,
		setIsIntervalEnabled,
	} = useUserContext()

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = event.target
		setFormData({ [name]: value } as any)
	}

	const isObsToggleDisabled =
		!isTwitchAuthorized || !formData.obsWebsocketAddress || props.isBotConnected
	const isIntervalToggleDisabled = !isTwitchAuthorized || props.isBotConnected

	return (
		<div className='app-container-column'>
			<div className='app-form-title session-prefs-title-spacer' aria-hidden='true'>
				Session Preferences:
			</div>

			{/* OBS preferences */}
			<div className='toggle-field obs-prefs-element'>
				<input
					type='checkbox'
					id='obsResponseToggle'
					checked={isObsResponseEnabled}
					disabled={isObsToggleDisabled}
					onChange={() => {
						setIsObsResponseEnabled(!isObsResponseEnabled)
					}}
					className={isObsToggleDisabled ? 'disabled-toggle' : ''}
				/>
				<label
					htmlFor='obsResponseToggle'
					className={
						(!isObsResponseEnabled || isObsToggleDisabled
							? 'disabled-label'
							: '') +
						(!isObsResponseEnabled || isObsToggleDisabled
							? ' greyed-out-label'
							: '')
					}
				>
					Enable OBS Responses
				</label>
			</div>

			<div className='form-field session-pref-field'>
				<label
					htmlFor='obs-clear-display-time'
					className={
						!isObsResponseEnabled || props.isBotConnected
							? 'disabled-label'
							: ''
					}
				>
					Display time (in seconds):
				</label>

				<input
					className={
						!isObsResponseEnabled || props.isBotConnected
							? 'pref-input disabled-label'
							: 'pref-input'
					}
					type='text'
					id='obs-clear-display-time'
					name='obsClearDisplayTime'
					value={formData.obsClearDisplayTime}
					onChange={handleInputChange}
					disabled={!isObsResponseEnabled || props.isBotConnected}
				/>
				<span
					className={`question-icon ${
						props.showTooltip === 'obsClearDisplayTime' ? 'active-icon' : ''
					}`}
					onClick={() =>
						props.setShowTooltip(
							props.showTooltip === 'obsClearDisplayTime'
								? null
								: 'obsClearDisplayTime'
						)
					}
				>
					?
				</span>
			</div>

			{/* Interval Message preferences */}
			<div className='toggle-field interval-prefs-element'>
				<input
					type='checkbox'
					disabled={isIntervalToggleDisabled}
					id='intervalMessageToggle'
					checked={isIntervalEnabled}
					onChange={() => setIsIntervalEnabled(!isIntervalEnabled)}
					className={isIntervalToggleDisabled ? 'disabled-toggle' : ''}
				/>

				<label
					htmlFor='intervalMessageToggle'
					className={
						(!isIntervalEnabled || isIntervalToggleDisabled
							? 'disabled-label'
							: '') + (props.isBotConnected ? ' greyed-out-label' : '')
					}
				>
					Enable Interval Messages
				</label>
			</div>

			<div className='form-field session-pref-field'>
				<label
					htmlFor='obs-interval-duration'
					className={
						!isIntervalEnabled || props.isBotConnected
							? 'disabled-label'
							: ''
					}
				>
					Duration (in minutes):
				</label>

				<input
					className={
						!isIntervalEnabled || props.isBotConnected
							? 'disabled-label pref-input'
							: 'pref-input'
					}
					type='text'
					id='obs-interval-duration'
					name='intervalMessageDuration'
					value={formData.intervalMessageDuration}
					onChange={handleInputChange}
					disabled={!isIntervalEnabled || props.isBotConnected}
				/>
				<span
					className={`question-icon ${
						props.showTooltip === 'intervalMessageDuration'
							? 'active-icon'
							: ''
					}`}
					onClick={() =>
						props.setShowTooltip(
							props.showTooltip === 'intervalMessageDuration'
								? null
								: 'intervalMessageDuration'
						)
					}
				>
					?
				</span>
			</div>
		</div>
	)
}

export default SessionPreferencesPanel
