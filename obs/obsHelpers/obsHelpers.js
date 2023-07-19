const dotenv = require("dotenv");
dotenv.config();

const clearOBSResponse = (obs) => {
  setTimeout(() => {
    obs.call("SetInputSettings", {
      inputName: "obs-chat-response",
      inputSettings: {
        text: "",
      },
    });
  }, parseInt(process.env.OBS_DISPLAY_DURATION, 10));
};

module.exports = clearOBSResponse;
