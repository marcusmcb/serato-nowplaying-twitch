import '../App.css'

type PreferencesPanelProps = {
  formData: {
    twitchChannelName: string
		twitchChatbotName: string
		oauthKey: string
		seratoDisplayName: string
		obsWebsocketAddress?: string // optional
		obsWebsocketPassword?: string // optional
    obsClearDisplayTime: string
    obsIntervalDuration: string
    userEmailAddress: string
  };
  isObsResponseEnabled: boolean;
  setIsObsResponseEnabled: (value: boolean) => void;
  isIntervalEnabled: boolean;
  setIsIntervalEnabled: (value: boolean) => void;
  isReportEnabled: boolean;
  setIsReportEnabled: (value: boolean) => void;
  handleInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  showTooltip: string | null;
  setShowTooltip: (value: string | null) => void;
};

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
						!(props.formData.obsWebsocketAddress && props.formData.obsWebsocketPassword)
					}
					onChange={() => props.setIsObsResponseEnabled(!props.isObsResponseEnabled)}
				/>
				<label
					htmlFor='obsResponseToggle'
					className={!props.isObsResponseEnabled ? 'disabled-label' : ''}
				>
					Enable On-Screen OBS Responses
				</label>
			</div>

			<div className='form-field'>
				<label
					htmlFor='obs-clear-display-time'
					className={!props.isObsResponseEnabled ? 'disabled-label' : ''}
				>
					On-screen display time:
				</label>

				<input
					type='text'
					id='obs-clear-display-time'
					name='obsClearDisplayTime' // You might want to change this name to match its purpose, e.g., 'intervalDuration'
					value={props.formData.obsClearDisplayTime} // Again, you might want to update this to props.formData.intervalDuration
					onChange={props.handleInputChange}
					placeholder='enter time in seconds'
					disabled={!props.isObsResponseEnabled}
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
					id='intervalMessageToggle'
					checked={props.isIntervalEnabled}
					onChange={() => props.setIsIntervalEnabled(!props.isIntervalEnabled)}
				/>

				<label
					htmlFor='intervalMessageToggle'
					className={!props.isIntervalEnabled ? 'disabled-label' : ''}
				>
					Enable Interval Messages
				</label>
			</div>
			<div className='form-field'>
				<label
					htmlFor='obs-interval-duration'
					className={!props.isIntervalEnabled ? 'disabled-label' : ''}
				>
					Interval Duration:
				</label>

				<input
					type='text'
					id='obs-interval-duration'
					name='obsIntervalDuration' // You might want to change this name to match its purpose, e.g., 'intervalDuration'
					value={props.formData.obsIntervalDuration} // Again, you might want to update this to props.formData.intervalDuration
					onChange={props.handleInputChange}
					placeholder='enter time in minutes'
					disabled={!props.isIntervalEnabled}
				/>
				<span
					className={`question-icon ${
						props.showTooltip === 'obsIntervalDuration' ? 'active-icon' : ''
					}`}
					onClick={() =>
						props.setShowTooltip(
							props.showTooltip === 'obsIntervalDuration'
								? null
								: 'obsIntervalDuration'
						)
					}
				>
					?
				</span>
			</div>
			<div className='toggle-field report-prefs-element'>
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
					type='text'
					id='is-report-enabled'
					name='userEmailAddress' // You might want to change this name to match its purpose, e.g., 'intervalDuration'
					value={props.formData.userEmailAddress} // Again, you might want to update this to props.formData.intervalDuration
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
							props.showTooltip === 'userEmailAddress' ? null : 'userEmailAddress'
						)
					}
				>
					?
				</span>
			</div>
		</div>
	)
}

export default PreferencesPanel
