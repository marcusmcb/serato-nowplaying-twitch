const { npCommand } = require('../commands/now-playing/nowPlaying')
const { statsCommand } = require('../commands/stats/stats')
const { testCommand } = require('../commands/test-command/testCommand')

const commandList = {
	test: testCommand,
    np: npCommand,
    stats: statsCommand
}

module.exports = commandList
