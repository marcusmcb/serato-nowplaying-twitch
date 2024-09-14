const { npCommands } = require('../commands/now-playing/npCommands')
const { statsCommand } = require('../commands/stats/stats')
const { testCommand } = require('../commands/test-command/testCommand')
const { dypCommand } = require('../commands/stats/didYouPlay')
const { doublesCommand } = require('../commands/stats/doublesPlayed')
const { dypInfo, statsInfo, npInfo } = require('../auto-commands/autoCommands')

const commandList = {
	test: testCommand,
	np: npCommands,
	dyp: dypCommand,
	stats: statsCommand,
	doubles: doublesCommand,	
	dypInfo: dypInfo,
	statsInfo: statsInfo,
	npInfo: npInfo,
}

const urlCommandList = {
	np: npCommands,
	dyp: dypCommand,
	stats: statsCommand,
	doubles: doublesCommand,	
}

module.exports = {
	commandList: commandList,
	urlCommandList: urlCommandList,
}
