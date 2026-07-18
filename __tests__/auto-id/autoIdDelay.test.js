const { sendAutoIdMessage } = require('../../bot-assets/auto-id/trackCurrentSongPlaying')

describe('Auto ID delay', () => {
	beforeEach(() => {
		jest.useFakeTimers()
	})

	afterEach(() => {
		jest.useRealTimers()
	})

	test('sends each detected song after the configured delay', () => {
		const twitchClient = { say: jest.fn() }
		const channel = '#test-channel'

		sendAutoIdMessage(twitchClient, channel, 'Artist A - Song A', true, 10)
		jest.advanceTimersByTime(6000)
		sendAutoIdMessage(twitchClient, channel, 'Artist B - Song B', true, 10)

		expect(twitchClient.say).not.toHaveBeenCalled()

		jest.advanceTimersByTime(4000)
		expect(twitchClient.say).toHaveBeenCalledTimes(1)
		expect(twitchClient.say).toHaveBeenLastCalledWith(
			channel,
			'Now playing: Artist A - Song A'
		)

		jest.advanceTimersByTime(6000)
		expect(twitchClient.say).toHaveBeenCalledTimes(2)
		expect(twitchClient.say).toHaveBeenLastCalledWith(
			channel,
			'Now playing: Artist B - Song B'
		)
	})

	test('sends immediately when delay is disabled', () => {
		const twitchClient = { say: jest.fn() }
		const channel = '#test-channel'

		sendAutoIdMessage(twitchClient, channel, 'Artist A - Song A', false, 10)

		expect(twitchClient.say).toHaveBeenCalledWith(
			channel,
			'Now playing: Artist A - Song A'
		)
	})
})
