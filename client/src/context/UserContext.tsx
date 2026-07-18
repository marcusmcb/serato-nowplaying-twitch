import { createContext, useContext } from 'react'

export type UserContextType = {
	// Preferences and state
	isObsResponseEnabled: boolean
	setIsObsResponseEnabled: (v: boolean) => void
	isIntervalEnabled: boolean
	setIsIntervalEnabled: (v: boolean) => void
	isReportEnabled: boolean
	setIsReportEnabled: (v: boolean) => void
	isSpotifyEnabled: boolean
	setIsSpotifyEnabled: (v: boolean) => void
	isAutoIDEnabled: boolean
	setIsAutoIDEnabled: (v: boolean) => void
	isAutoIDCleanupEnabled: boolean
	setIsAutoIDCleanupEnabled: (v: boolean) => void
	isAutoIDDelayEnabled: boolean
	setIsAutoIDDelayEnabled: (v: boolean) => void
	continueLastPlaylist: boolean
	setContinueLastPlaylist: (v: boolean) => void
	autoIDDelaySeconds: number
	setAutoIDDelaySeconds: (v: number) => void
	obsClearDisplayTime: number
	setObsClearDisplayTime: (v: number) => void
	intervalMessageDuration: number
	setIntervalMessageDuration: (v: number) => void
	// Authorizations
	isTwitchAuthorized: boolean
	setIsTwitchAuthorized: (v: boolean) => void
	isSpotifyAuthorized: boolean
	setIsSpotifyAuthorized: (v: boolean) => void
	isDiscordAuthorized: boolean
	setIsDiscordAuthorized: (v: boolean) => void
	// Hydration status
	isUserContextReady: boolean
	// Connection readiness
	isConnectionReady: boolean
	// Form data and modification tracking
	formData: {
		_id: string
		twitchChannelName: string
		twitchChatbotName: string
		// Refresh tokens are stored securely in the OS keystore and are not exposed to the renderer
		seratoDisplayName: string
		obsWebsocketAddress: string
		obsWebsocketPassword: string
		intervalMessageDuration: string
		obsClearDisplayTime: string
		userEmailAddress: string
		isObsResponseEnabled: boolean
		isIntervalEnabled: boolean
		isReportEnabled: boolean
		isSpotifyEnabled: boolean
		continueLastPlaylist: boolean
		isAutoIDEnabled: boolean
		isAutoIDCleanupEnabled: boolean
		isAutoIDDelayEnabled: boolean
		autoIDDelaySeconds: string
	}
	setFormData: (patch: Partial<UserContextType['formData']>) => void
	initialFormData: UserContextType['formData']
	initialPreferences: {
		isObsResponseEnabled: boolean
		isIntervalEnabled: boolean
		isReportEnabled: boolean
		isSpotifyEnabled: boolean
		isAutoIDEnabled: boolean
		isAutoIDCleanupEnabled: boolean
		isAutoIDDelayEnabled: boolean
		continueLastPlaylist: boolean
		autoIDDelaySeconds: number
		obsClearDisplayTime: number
		intervalMessageDuration: number
	}
	isFormModified: boolean
	commitInitial: (
		nextFormData?: UserContextType['formData'],
		nextPreferences?: {
			isObsResponseEnabled: boolean
			isIntervalEnabled: boolean
			isReportEnabled: boolean
			isSpotifyEnabled: boolean
			isAutoIDEnabled: boolean
			isAutoIDCleanupEnabled: boolean
			isAutoIDDelayEnabled: boolean
			continueLastPlaylist: boolean
			autoIDDelaySeconds: number
			obsClearDisplayTime: number
			intervalMessageDuration: number
		}
	) => void
	// Add more as needed
}

export const UserContext = createContext<UserContextType | undefined>(undefined)

export const useUserContext = () => {
	const ctx = useContext(UserContext)
	if (!ctx) throw new Error('useUserContext must be used within a UserProvider')
	return ctx
}
