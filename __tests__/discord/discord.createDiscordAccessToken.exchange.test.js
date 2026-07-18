describe('Discord exchangeCodeForDiscordToken', () => {
  let axios
  let MockAdapter
  let mock

  beforeEach(() => {
    jest.resetModules()
    axios = require('axios')
    MockAdapter = require('axios-mock-adapter')
    mock = new MockAdapter(axios)
  })

  afterEach(() => {
    mock.restore()
    jest.restoreAllMocks()
  })

  it('getDiscordAuthUrl reads env vars at call-time (packaged build scenario)', async () => {
    delete process.env.DISCORD_CLIENT_ID
    delete process.env.DISCORD_CLIENT_SECRET
    delete process.env.DISCORD_REDIRECT_URI

    const { getDiscordAuthUrl } = require('../../auth/discord/handleDiscordAuth')

    process.env.DISCORD_CLIENT_ID = 'late-client-id'
    process.env.DISCORD_REDIRECT_URI =
      'http://localhost:5003/auth/discord/callback'

    const url = getDiscordAuthUrl('state123')
    expect(url).toContain('client_id=late-client-id')
    expect(url).toContain(
      'redirect_uri=http%3A%2F%2Flocalhost%3A5003%2Fauth%2Fdiscord%2Fcallback'
    )
  })

  it('returns null auth URL when Discord client id is missing', async () => {
    delete process.env.DISCORD_CLIENT_ID
    process.env.DISCORD_REDIRECT_URI = 'http://localhost:5003/auth/discord/callback'

    const { getDiscordAuthUrl } = require('../../auth/discord/handleDiscordAuth')
    const url = getDiscordAuthUrl('state123')
    expect(url).toBeNull()
  })

  it('returns token payload on success', async () => {
    process.env.DISCORD_CLIENT_ID = 'disc-client-id'
    process.env.DISCORD_CLIENT_SECRET = 'disc-client-secret'
    process.env.DISCORD_REDIRECT_URI = 'http://localhost:5003/auth/discord/callback'

    const { exchangeCodeForDiscordToken } = require('../../auth/discord/handleDiscordAuth')

    mock.onPost('https://discord.com/api/oauth2/token').reply(200, { access_token: 'acc', refresh_token: 'ref' })
    const res = await exchangeCodeForDiscordToken('code123')
    expect(res).toEqual({ access_token: 'acc', refresh_token: 'ref' })
  })

  it('returns error object on failure', async () => {
    process.env.DISCORD_CLIENT_ID = 'disc-client-id'
    process.env.DISCORD_CLIENT_SECRET = 'disc-client-secret'
    process.env.DISCORD_REDIRECT_URI = 'http://localhost:5003/auth/discord/callback'

    const { exchangeCodeForDiscordToken } = require('../../auth/discord/handleDiscordAuth')

    mock.onPost('https://discord.com/api/oauth2/token').reply(500, { error: 'server_error' })
    const res = await exchangeCodeForDiscordToken('code123')
    expect(res).toHaveProperty('error')
  })

  it('returns missing_config error when required env vars are missing', async () => {
    process.env.DISCORD_CLIENT_ID = 'disc-client-id'
    delete process.env.DISCORD_CLIENT_SECRET
    process.env.DISCORD_REDIRECT_URI = 'http://localhost:5003/auth/discord/callback'

    const { exchangeCodeForDiscordToken } = require('../../auth/discord/handleDiscordAuth')
    const res = await exchangeCodeForDiscordToken('code123')
    expect(res).toMatchObject({
      error: 'missing_config',
    })
  })
})
