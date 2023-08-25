const OBSWebSocket = require("obs-websocket-js").default;
const dotenv = require("dotenv");

dotenv.config();

const OBSWebSocketAddress = process.env.OBS_WEBSOCKET_ADDRESS;
const OBSWebSocketPassword = process.env.OBS_WEBSOCKET_PASSWORD;
const isOBSResponseEnabled = process.env.DISPLAY_OBS_MESSAGES;
const obs = new OBSWebSocket();

const connectToOBS = async () => {
  console.log("OBS enabled? ", isOBSResponseEnabled)
  console.log("Address: ", OBSWebSocketAddress)
  console.log("Password: ", OBSWebSocketPassword)
  if (isOBSResponseEnabled === 'true') {
    try {
      await obs.connect(OBSWebSocketAddress, OBSWebSocketPassword);
      console.log("Connected to OBS");
    } catch (error) {
      console.error("Failed to connect to OBS:", error);
      return
    }
  } else {
    return 
  }
  
};

connectToOBS();

module.exports = obs;
