import '../App.css'
import React from 'react';

type CredentialsPanelProps = {
	formData: {
		twitchChannelName: string
		twitchChatbotName: string
		oauthKey: string
		seratoDisplayName: string
		obsWebsocketAddress?: string
		obsWebsocketPassword?: string
	}
	handleInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void
	showTooltip: string | null
	setShowTooltip: (value: string | null) => void
	handleSubmit: (event: React.FormEvent<HTMLFormElement>) => void
}

type FieldConfig = {
	id: string
	label: string
	name: keyof CredentialsPanelProps['formData']
	placeholder?: string
}

const fieldsConfig: FieldConfig[] = [
	{
		id: 'twitch-channel-name',
		label: 'Twitch Channel Name:',
		name: 'twitchChannelName'
	},
	{
		id: 'twitch-chatbot-name',
		label: 'Twitch Chatbot Name:',
		name: 'twitchChatbotName'
	},
	{
		id: 'oauth-key',
		label: 'Twitch OAuth Key:',
		name: 'oauthKey'
	},
	{
		id: 'serato-display-name',
		label: 'Serato Display Name:',
		name: 'seratoDisplayName'
	},
	{
		id: 'obs-websocket-address',
		label: 'OBS Websocket Address:',
		name: 'obsWebsocketAddress',
		placeholder: 'optional'
	},
	{
		id: 'obs-websocket-password',
		label: 'OBS Websocket Password:',
		name: 'obsWebsocketPassword',
		placeholder: 'optional'
	},
]

const InputField: React.FC<{
	fieldConfig: FieldConfig
	value: string | undefined
	handleInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void
	showTooltip: string | null
	setShowTooltip: (value: string | null) => void
}> = ({ fieldConfig, value, handleInputChange, showTooltip, setShowTooltip }) => (
	<div className='form-field'>
		<label htmlFor={fieldConfig.id}>{fieldConfig.label}</label>
		<input
			type='text'
			id={fieldConfig.id}
			name={fieldConfig.name}
			value={value || ''}
			onChange={handleInputChange}
			placeholder={fieldConfig.placeholder}
		/>
		<span
			className={`question-icon ${showTooltip === fieldConfig.name ? 'active-icon' : ''}`}
			onClick={() =>
				setShowTooltip(
					showTooltip === fieldConfig.name ? null : fieldConfig.name
				)
			}
		>
			?
		</span>
	</div>
)

const CredentialsPanel: React.FC<CredentialsPanelProps> = (props) => {
	return (
		<div className='app-container-column'>
			<div className='app-form-title'>Enter your credentials below:</div>
			<form className='app-form' onSubmit={props.handleSubmit}>
				{fieldsConfig.map((field) => (
					<InputField
						key={field.id}
						fieldConfig={field}
						value={props.formData[field.name]}
						handleInputChange={props.handleInputChange}
						showTooltip={props.showTooltip}
						setShowTooltip={props.setShowTooltip}
					/>
				))}
				<div className='button-row'>
					<button type='submit'>Submit</button>
					<button type='submit'>Update</button>
				</div>
			</form>
		</div>
	)
}

export default CredentialsPanel;
