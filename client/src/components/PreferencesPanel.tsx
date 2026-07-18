/*

add option in the preferences UI for the user to
- enter in their own Spotify playlist title
- use the default ("Twitch Stream Playlist - Date")
- use their current Twitch stream title

add option to resume last Spotify playlist on startup
- if npChatbot has been disconnected, restarted, crashed, etc

*/

import React from 'react'
import '../App.css'
import './styles/preferencespanel.css'
import { useUserContext } from '../context/UserContext'

type PreferencesPanelProps = {
	showTooltip: string | null
	setShowTooltip: (value: string | null) => void
	isBotConnected: boolean
}

const PreferencesPanel: React.FC<PreferencesPanelProps> = (props) => {
	const {
		isTwitchAuthorized,
		isSpotifyAuthorized,
		isSpotifyEnabled,
		setIsSpotifyEnabled,
		continueLastPlaylist,
		setContinueLastPlaylist,
		isAutoIDEnabled,
		setIsAutoIDEnabled,
		isAutoIDCleanupEnabled,
		setIsAutoIDCleanupEnabled,
		isAutoIDDelayEnabled,
		setIsAutoIDDelayEnabled,
		autoIDDelaySeconds,
		setAutoIDDelaySeconds,
	} = useUserContext()

	const isSpotifyToggleDisabled = !isSpotifyAuthorized || props.isBotConnected
	const isContinueLastDisabled =
		!isSpotifyAuthorized || !isSpotifyEnabled || props.isBotConnected
	const isAutoIdToggleDisabled = !isTwitchAuthorized || props.isBotConnected
	const isAutoIdCleanupDisabled =
		!isTwitchAuthorized || !isAutoIDEnabled || props.isBotConnected
	const isAutoIdDelayDisabled =
		!isTwitchAuthorized || !isAutoIDEnabled || props.isBotConnected
	const handleAutoIDDelayChange = (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		if (event.target.value === '') {
			setAutoIDDelaySeconds(0)
			return
		}
		const nextValue = Number(event.target.value)
		setAutoIDDelaySeconds(Math.max(0, Math.min(99, nextValue)))
	}


	return (
		<div className='app-container-column'>
			<div className='app-form-title'>Chatbot Preferences:</div>

			{/* Spotify Preferences */}
			<div className='toggle-field spotify-prefs-element'>
				<input
					type='checkbox'
					disabled={isSpotifyToggleDisabled}
					id='spotifyPlaylistEnabled'
					checked={isSpotifyEnabled}
					onChange={() => setIsSpotifyEnabled(!isSpotifyEnabled)}
					className={isSpotifyToggleDisabled ? 'disabled-toggle' : ''}
				/>
				<label
					htmlFor='spotifyPlaylistEnabled'
					className={
						(!isSpotifyEnabled || isSpotifyToggleDisabled
							? 'disabled-label'
							: '') + (props.isBotConnected ? ' greyed-out-label' : '')
					}
				>
					Enable Spotify© Playlist
				</label>
				<span
					className={`question-icon ${
						props.showTooltip === 'spotifyPlaylistEnabled' ? 'active-icon' : ''
					}`}
					onClick={() =>
						props.setShowTooltip(
							props.showTooltip === 'spotifyPlaylistEnabled'
								? null
								: 'spotifyPlaylistEnabled'
						)
					}
				>
					?
				</span>
			</div>

			<div className='toggle-field interval-prefs-element'>
				<input
					type='checkbox'
					disabled={isContinueLastDisabled}
					id='continueLastPlaylist'
					checked={continueLastPlaylist}
					onChange={() => setContinueLastPlaylist(!continueLastPlaylist)}
					className={isContinueLastDisabled ? 'disabled-toggle' : ''}
				/>
				<label
					htmlFor='continueLastPlaylist'
					className={
						(!continueLastPlaylist || isContinueLastDisabled
							? 'disabled-label'
							: '') + (props.isBotConnected ? ' greyed-out-label' : '')
					}
				>
					Continue Last Playlist
				</label>
				<span
					className={`question-icon ${
						props.showTooltip === 'continueLastPlaylist' ? 'active-icon' : ''
					}`}
					onClick={() =>
						props.setShowTooltip(
							props.showTooltip === 'continueLastPlaylist'
								? null
								: 'continueLastPlaylist'
						)
					}
				>
					?
				</span>
			</div>

			{/* Auto ID Preferences */}
			<div className='toggle-field interval-prefs-element'>
				<input
					type='checkbox'
					disabled={isAutoIdToggleDisabled}
					id='autoIDEnabled'
					checked={isAutoIDEnabled}
					onChange={() => setIsAutoIDEnabled(!isAutoIDEnabled)}
					className={isAutoIdToggleDisabled ? 'disabled-toggle' : ''}
				/>
				<label
					htmlFor='autoIDEnabled'
					className={
						(!isAutoIDEnabled || isAutoIdToggleDisabled
							? 'disabled-label'
							: '') + (props.isBotConnected ? ' greyed-out-label' : '')
					}
				>
					Enable Auto ID
				</label>
				<span
					className={`question-icon ${
						props.showTooltip === 'autoIDEnabled' ? 'active-icon' : ''
					}`}
					onClick={() =>
						props.setShowTooltip(
							props.showTooltip === 'autoIDEnabled' ? null : 'autoIDEnabled'
						)
					}
				>
					?
				</span>
			</div>

			<div className='toggle-field interval-prefs-element'>
				<input
					type='checkbox'
					disabled={isAutoIdCleanupDisabled}
					id='autoIDCleanupEnabled'
					checked={isAutoIDCleanupEnabled}
					onChange={() => setIsAutoIDCleanupEnabled(!isAutoIDCleanupEnabled)}
					className={isAutoIdCleanupDisabled ? 'disabled-toggle' : ''}
				/>
				<label
					htmlFor='autoIDCleanupEnabled'
					className={
						(!isAutoIDEnabled ||
						!isAutoIDCleanupEnabled ||
						isAutoIdCleanupDisabled
							? 'disabled-label'
							: '') +
						(props.isBotConnected || !isAutoIDEnabled
							? ' greyed-out-label'
							: '')
					}
				>
					Enable Auto ID Cleanup
				</label>
				<span
					className={`question-icon ${
						props.showTooltip === 'autoIDCleanupEnabled' ? 'active-icon' : ''
					}`}
					onClick={() =>
						props.setShowTooltip(
							props.showTooltip === 'autoIDCleanupEnabled'
								? null
								: 'autoIDCleanupEnabled'
						)
					}
				>
					?
				</span>
			</div>

			<div className='toggle-field interval-prefs-element'>
				<input
					type='checkbox'
					disabled={isAutoIdDelayDisabled}
					id='autoIDDelayEnabled'
					checked={isAutoIDDelayEnabled}
					onChange={() => setIsAutoIDDelayEnabled(!isAutoIDDelayEnabled)}
					className={isAutoIdDelayDisabled ? 'disabled-toggle' : ''}
				/>
				<div className='auto-id-delay-control'>
					<label
						htmlFor='autoIDDelayEnabled'
						className={
							(!isAutoIDEnabled ||
							!isAutoIDDelayEnabled ||
							isAutoIdDelayDisabled
								? 'disabled-label'
								: '') +
							(props.isBotConnected || !isAutoIDEnabled
								? ' greyed-out-label'
								: '')
						}
					>
						Auto ID Delay
					</label>
					<input
						type='number'
						min='0'
						max='99'
						id='autoIDDelaySeconds'
						value={autoIDDelaySeconds}
						disabled={!isAutoIDDelayEnabled || isAutoIdDelayDisabled}
						onChange={handleAutoIDDelayChange}
						className='auto-id-delay-input'
					/>
				</div>
				<span
					className={`question-icon ${
						props.showTooltip === 'autoIDDelayEnabled' ? 'active-icon' : ''
					}`}
					onClick={() =>
						props.setShowTooltip(
							props.showTooltip === 'autoIDDelayEnabled'
								? null
								: 'autoIDDelayEnabled'
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
