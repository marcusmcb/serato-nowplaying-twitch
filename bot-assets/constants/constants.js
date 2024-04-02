const NO_LIVE_DATA_MESSAGE =
	'No live playlist data for this stream at the moment.'

const ERROR_MESSAGE = "That doesn't appear to be working right now."

const OBS_AUTH_ERROR = 'Authentication is required. Check your password.'

const OBS_AUTH_FAILURE = 'Authentication failed. Please check that your password is correct.'

const OBS_TIMEOUT_ERROR = 'OBS connection timed out. Check your OBS websocket address or disable OBS responses.'

const OBS_SOCKET_ERROR = 'OBS connection refused. Make sure OBS is running & check your websocket address & port address.'

const OBS_DEFAULT_ERROR = 'Unable to connect to OBS'



module.exports = {
  NO_LIVE_DATA_MESSAGE,
  ERROR_MESSAGE,
  OBS_AUTH_ERROR,
  OBS_AUTH_FAILURE,
  OBS_TIMEOUT_ERROR,
  OBS_SOCKET_ERROR,
  OBS_DEFAULT_ERROR
}

