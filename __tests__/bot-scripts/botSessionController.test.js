const {
	createBotSessionController,
	BOT_SESSION_STATES,
} = require('../../bot-scripts/botSessionController')

const createDeferred = () => {
	let resolve
	let reject
	const promise = new Promise((res, rej) => {
		resolve = res
		reject = rej
	})
	return { promise, resolve, reject }
}

const createController = (overrides = {}) => {
	const deps = {
		loadConfigurations: jest.fn(async () => ({ _id: 'user-1' })),
		initializeBot: jest.fn(async () => ({ client: 'tmi' })),
		handleStartBotScript: jest.fn(async () => ({ success: true })),
		handleStopBotScript: jest.fn(async () => ({ success: true })),
		getCurrentPlaylistSummary: jest.fn(async () => null),
		createPlaylistSummary: jest.fn(async (playlist) => ({ ...playlist })),
		addPlaylist: jest.fn(async () => undefined),
		getUserData: jest.fn(async () => null),
		db: {},
		logToFile: jest.fn(),
		...overrides,
	}

	const controller = createBotSessionController(deps)
	return { controller, deps }
}

describe('botSessionController', () => {
	afterEach(() => {
		jest.clearAllMocks()
	})

	it('starts from idle and transitions to connected on successful start', async () => {
		const { controller, deps } = createController()

		expect(controller.getState()).toBe(BOT_SESSION_STATES.IDLE)
		expect(controller.getIsConnected()).toBe(false)

		const result = await controller.start({}, { isObsResponseEnabled: false })

		expect(result).toEqual({
			success: true,
			message: 'npChatbot is connected to your Twitch channel.',
		})
		expect(deps.handleStartBotScript).toHaveBeenCalledTimes(1)
		expect(deps.loadConfigurations).toHaveBeenCalledTimes(1)
		expect(deps.initializeBot).toHaveBeenCalledTimes(1)
		expect(controller.getState()).toBe(BOT_SESSION_STATES.CONNECTED)
		expect(controller.getIsConnected()).toBe(true)
	})

	it('rejects a second start while already connected', async () => {
		const { controller, deps } = createController()

		await controller.start({}, {})
		const second = await controller.start({}, {})

		expect(second).toEqual({
			success: false,
			error: 'Bot is already running.',
		})
		expect(deps.handleStartBotScript).toHaveBeenCalledTimes(1)
	})

	it('returns to idle when pre-start validation fails', async () => {
		const { controller, deps } = createController({
			handleStartBotScript: jest.fn(async () => ({
				success: false,
				error: 'bad token',
			})),
		})

		const result = await controller.start({}, {})

		expect(result).toEqual({ success: false, error: 'bad token' })
		expect(controller.getState()).toBe(BOT_SESSION_STATES.IDLE)
		expect(controller.getIsConnected()).toBe(false)
		expect(deps.loadConfigurations).not.toHaveBeenCalled()
	})

	it('returns stop guard error while idle', async () => {
		const { controller } = createController()

		const result = await controller.stop({})

		expect(result).toEqual({
			success: false,
			error: 'No bot client is currently running.',
		})
		expect(controller.getState()).toBe(BOT_SESSION_STATES.IDLE)
	})

	it('persists playlist summary and transitions to idle on successful stop', async () => {
		const playlistData = { total_tracks_played: 3 }
		const finalSummary = { total_tracks_played: 3, spotify_link: '' }
		const { controller, deps } = createController({
			getCurrentPlaylistSummary: jest.fn(async () => playlistData),
			createPlaylistSummary: jest.fn(async () => ({ ...finalSummary })),
			getUserData: jest.fn(async () => ({
				isSpotifyEnabled: true,
				currentSpotifyPlaylistLink: 'https://spotify.test/playlist/abc',
			})),
		})

		await controller.start({}, {})
		const result = await controller.stop({})

		expect(result).toEqual({
			success: true,
			message: 'npChatbot has been disconnected from Twitch.',
		})
		expect(deps.addPlaylist).toHaveBeenCalledTimes(1)
		expect(deps.addPlaylist).toHaveBeenCalledWith({
			total_tracks_played: 3,
			spotify_link: 'https://spotify.test/playlist/abc',
		})
		expect(controller.getState()).toBe(BOT_SESSION_STATES.IDLE)
		expect(controller.getIsConnected()).toBe(false)
	})

	it('returns connected guard while stop is already in progress', async () => {
		const pendingStop = createDeferred()
		const { controller } = createController({
			getCurrentPlaylistSummary: jest.fn(async () => ({ total_tracks_played: 0 })),
			handleStopBotScript: jest.fn(() => pendingStop.promise),
		})

		await controller.start({}, {})
		const firstStopPromise = controller.stop({})
		const secondStopResult = await controller.stop({})

		expect(secondStopResult).toEqual({
			success: false,
			error: 'Bot is already stopping. Please wait.',
		})

		pendingStop.resolve({ success: true })
		await firstStopPromise
	})

	it('forceReset clears connection and returns to idle', async () => {
		const { controller } = createController()
		await controller.start({}, {})

		controller.forceReset()

		expect(controller.getState()).toBe(BOT_SESSION_STATES.IDLE)
		expect(controller.getIsConnected()).toBe(false)
	})
})
