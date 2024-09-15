const clearOBSResponse = (obs, obsClearDisplayTime) => {  
  setTimeout(() => {
    obs.call("SetInputSettings", {
      inputName: "npchatbot-response",
      inputSettings: {
        text: "",
      },
    });
  }, parseInt(obsClearDisplayTime * 1000, 10));
};

module.exports = clearOBSResponse;
