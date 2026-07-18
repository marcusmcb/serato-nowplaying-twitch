const http = require('http')

describe('Spotify Callback Server', () => {
  let startServer
  let initSpotifyAuthTokenMock
  let setSpotifyUserIdMock
  let server
  let port
  let wss
  let mainWindow

  beforeEach(async () => {
    jest.resetModules()

    // Mocks for token initialization and user id setting
    initSpotifyAuthTokenMock = jest.fn().mockResolvedValue(true)
    setSpotifyUserIdMock = jest.fn().mockResolvedValue(undefined)

    jest.doMock('../../auth/spotify/createSpotifyAccessToken', () => ({
      initSpotifyAuthToken: initSpotifyAuthTokenMock,
    }))
    jest.doMock('../../auth/spotify/setSpotifyUserId', () => ({
      setSpotifyUserId: setSpotifyUserIdMock,
    }))

    // Import the server factory after mocks
    await jest.isolateModulesAsync(async () => {
      ;({ startSpotifyCallbackServer: startServer } = require('../../auth/spotify/spotifyCallbackServer'))
    })

    // Fake websocket server and mainWindow
    wss = { clients: [] }
    mainWindow = { webContents: { send: jest.fn() } }

    // Start server on random port
    server = startServer({ port: 0, wss, getMainWindow: () => mainWindow })
    await new Promise((resolve) => server.on('listening', resolve))
    port = server.address().port
  })

  afterEach(async () => {
    if (server && server.listening) {
      await new Promise((resolve) => server.close(() => resolve()))
    }
    jest.clearAllMocks()
    jest.restoreAllMocks()
  })

  const request = (path) =>
    new Promise((resolve, reject) => {
      const req = http.request(
        {
          hostname: '127.0.0.1',
          port,
          path,
          method: 'GET',
        },
        (res) => {
          let data = ''
          res.on('data', (c) => (data += c))
          res.on('end', () => resolve({ status: res.statusCode, body: data }))
        }
      )
      req.on('error', reject)
      req.end()
    })

  it('returns 404 for non-callback paths', async () => {
    const res = await request('/not/callback')
    expect(res.status).toBe(404)
    expect(res.body).toContain('Not Found')
  })

  it('handles error param with 400', async () => {
    const res = await request('/auth/spotify/callback?error=access_denied')
    expect(res.status).toBe(400)
    expect(res.body).toContain('Authorization failed')
    expect(initSpotifyAuthTokenMock).not.toHaveBeenCalled()
    expect(mainWindow.webContents.send).not.toHaveBeenCalled()
  })

  it('handles missing code with 400', async () => {
    const res = await request('/auth/spotify/callback')
    expect(res.status).toBe(400)
    expect(res.body).toContain('No authorization code')
    expect(initSpotifyAuthTokenMock).not.toHaveBeenCalled()
    expect(mainWindow.webContents.send).not.toHaveBeenCalled()
  })

  it('happy path: exchanges code, schedules user id set, and closes auth window', async () => {
    // Use fake timers before the request so the scheduled setTimeout is tracked
    jest.useFakeTimers()

    const res = await request('/auth/spotify/callback?code=goodcode&state=whatever')
    expect(res.status).toBe(200)
    expect(res.body).toContain('Authorization successful')

    // Token exchange called
    expect(initSpotifyAuthTokenMock).toHaveBeenCalledTimes(1)
    expect(initSpotifyAuthTokenMock).toHaveBeenCalledWith('goodcode', wss, mainWindow)

    // Renderer gets close instruction
    expect(mainWindow.webContents.send).toHaveBeenCalledWith('close-spotify-auth-window')

    // setSpotifyUserId is scheduled with setTimeout; advance timers to flush it
    jest.advanceTimersByTime(150)
    // Allow any microtasks to process
    await Promise.resolve()
    expect(setSpotifyUserIdMock).toHaveBeenCalled()
    jest.useRealTimers()
  })
})
