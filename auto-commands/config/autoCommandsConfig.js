const dotenv = require("dotenv");
dotenv.config();

const [autoCommandList] = require("../../auto-commands-list/autoCommandList");
const { commandList } = require("../../command-list/commandList");

const autoCommandsConfig = (client, obs, config) => {
  console.log("AUTO COMMANDS CONFIG: ")
  console.log(config)
  const channel = `#${config.twitchChannelName}`;
  let tags, args;
  let commandIndex = 0;

  if (config.isIntervalEnabled === true) {
    console.log("Interval messages will be displayed during this stream.");
    setInterval(() => {
      let command = autoCommandList[commandIndex];
      if (command in commandList) {
        commandList[command](channel, tags, args, client, obs);
      } else {
        console.log(`Command ${command} is not in the command list.`);
      }
      commandIndex++;
      // If we've gone past the end of the command list, loop back to the start
      if (commandIndex >= autoCommandList.length) {
        commandIndex = 0;
      }
    }, parseInt(process.env.AUTO_COMMAND_INTERVAL, 10));
  } else {
    console.log("No interval messages during this stream");
  }
};

module.exports = autoCommandsConfig;
