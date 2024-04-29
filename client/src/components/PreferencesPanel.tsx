import '../App.css'

type PreferencesPanelProps = {
	formData: {
		twitchChannelName: string
		twitchChatbotName: string		
		seratoDisplayName: string
		obsWebsocketAddress?: string
		obsWebsocketPassword?: string
		obsClearDisplayTime: string
		intervalMessageDuration: string
		userEmailAddress: string
	}

	isObsResponseEnabled: boolean
	setIsObsResponseEnabled: (value: boolean) => void
	isIntervalEnabled: boolean
	setIsIntervalEnabled: (value: boolean) => void
	isReportEnabled: boolean
	setIsReportEnabled: (value: boolean) => void
	handleInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void
	showTooltip: string | null
	setShowTooltip: (value: string | null) => void
	isBotConnected: boolean
}

const PreferencesPanel: React.FC<PreferencesPanelProps> = (props) => {
	return (
		<div className='app-container-column'>
			<div className='app-form-title'>Preferences:</div>
			<div className='toggle-field obs-prefs-element'>
				<input
					type='checkbox'
					id='obsResponseToggle'
					checked={props.isObsResponseEnabled}
					disabled={
						!(
							props.formData.obsWebsocketAddress &&
							props.formData.obsWebsocketPassword
						) || props.isBotConnected
					}
					onChange={() => {
						props.setIsObsResponseEnabled(!props.isObsResponseEnabled)
					}}
				/>
				<label
					htmlFor='obsResponseToggle'
					className={!props.isObsResponseEnabled || props.isBotConnected ? 'disabled-label' : ''}
				>
					Enable On-Screen OBS Responses
				</label>
			</div>

			<div className='form-field'>
				<label
					htmlFor='obs-clear-display-time'
					className={!props.isObsResponseEnabled || props.isBotConnected ? 'disabled-label' : ''}
				>
					Display time (in seconds):
				</label>

				<input
					className={!props.isObsResponseEnabled || props.isBotConnected ? 'disabled-label' : ''}
					type='text'
					id='obs-clear-display-time'
					name='obsClearDisplayTime'
					value={props.formData.obsClearDisplayTime}
					onChange={props.handleInputChange}
					placeholder='enter time in seconds'
					disabled={!props.isObsResponseEnabled }
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

			<div className='toggle-field interval-prefs-element'>
				<input
					type='checkbox'
					disabled={props.isBotConnected}
					id='intervalMessageToggle'
					checked={props.isIntervalEnabled}
					onChange={() => props.setIsIntervalEnabled(!props.isIntervalEnabled)}
				/>

				<label
					htmlFor='intervalMessageToggle'
					className={!props.isIntervalEnabled || props.isBotConnected ? 'disabled-label' : ''}
				>
					Enable Interval Messages
				</label>
			</div>
			<div className='form-field'>
				<label
					htmlFor='obs-interval-duration'
					className={!props.isIntervalEnabled || props.isBotConnected ? 'disabled-label' : ''}
				>
					Interval duration:
				</label>

				<input
					className={!props.isIntervalEnabled || props.isBotConnected ? 'disabled-label' : ''}
					type='text'
					id='obs-interval-duration'
					name='intervalMessageDuration'
					value={props.formData.intervalMessageDuration}
					onChange={props.handleInputChange}
					placeholder='enter time in minutes'
					disabled={!props.isIntervalEnabled || props.isBotConnected}
				/>
				<span
					className={`question-icon ${
						props.showTooltip === 'intervalMessageDuration' ? 'active-icon' : ''
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
			{/* <div className='toggle-field report-prefs-element'>
				<input
					type='checkbox'
					id='sendReportToggle'
					checked={props.isReportEnabled}
					onChange={() => props.setIsReportEnabled(!props.isReportEnabled)}
				/>

				<label
					htmlFor='sendReportToggle'
					className={!props.isReportEnabled ? 'disabled-label' : ''}
				>
					Send Post-Stream Report
				</label>
			</div>
			<div className='form-field'>
				<label
					htmlFor='is-report-enabled'
					className={!props.isReportEnabled ? 'disabled-label' : ''}
				>
					Email Address:
				</label>

				<input
					className={!props.isReportEnabled ? 'disabled-label' : ''}
					type='text'
					id='is-report-enabled'
					name='userEmailAddress'
					value={props.formData.userEmailAddress}
					onChange={props.handleInputChange}
					placeholder=''
					disabled={!props.isReportEnabled}
				/>
				<span
					className={`question-icon ${
						props.showTooltip === 'userEmailAddress' ? 'active-icon' : ''
					}`}
					onClick={() =>
						props.setShowTooltip(
							props.showTooltip === 'userEmailAddress'
								? null
								: 'userEmailAddress'
						)
					}
				>
					?
				</span>
			</div> */}
		</div>
	)
}

export default PreferencesPanel
