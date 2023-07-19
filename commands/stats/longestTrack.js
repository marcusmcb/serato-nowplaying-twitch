const dotenv = require("dotenv");
const createLiveReport = require("./createLiveReport");
const clearOBSResponse = require("../../obs/obsHelpers/obsHelpers");

dotenv.config();

const displayOBSResponse = process.env.DISPLAY_OBS_MESSAGES;

const displayLongestTrackMessage = (obs, tags, reportData) => {
  let message = `Longest song in ${tags.username}'s set so far : \n\n${reportData.longest_track.name}\n${reportData.longest_track.length_value} (played ${reportData.longest_track.time_since_played_string})`;
  obs.call("SetInputSettings", {
    inputName: "obs-chat-response",
    inputSettings: {
      text: message,
    },
  });
  clearOBSResponse(obs);
};

const longestTrackCommand = async (channel, tags, args, client, obs, url) => {
  try {
    const reportData = await createLiveReport(url);
    if (reportData.total_tracks_played === 0) {
      client.say(
        channel,
        "Sorry, no playlist stats for this stream at the moment."
      );
    } else {
      client.say(
        channel,
        `The longest song in ${tags.username}'s set (so far) is ${reportData.longest_track.name} (${reportData.longest_track.length_value})`
      );
      if (displayOBSResponse === "true") {
        displayLongestTrackMessage(obs, tags, reportData);
      }
    }
  } catch (error) {
    console.log(error);
    client.say(channel, "That doesn't appear to be working right now.");
  }
};

module.exports = {
  longestTrackCommand: longestTrackCommand,
};
