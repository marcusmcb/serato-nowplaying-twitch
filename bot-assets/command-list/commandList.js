const { npCommands } = require('../commands/now-playing/npCommands')
const { testCommand } = require('../commands/test-command/testCommand')
const { dypCommand } = require('../commands/stats/didYouPlay')
const { dypInfo, statsInfo, npInfo } = require('../auto-commands/autoCommands')

const commandList = {
	test: testCommand,
	np: npCommands,
	dyp: dypCommand,
	dypInfo: dypInfo,
	statsInfo: statsInfo,
	npInfo: npInfo,
}

const urlCommandList = {
	np: npCommands,
	dyp: dypCommand,
}

module.exports = {
	commandList: commandList,
	urlCommandList: urlCommandList,
}
