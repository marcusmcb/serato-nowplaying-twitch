const axios = require("axios");
const cheerio = require("cheerio");
const clearOBSResponse = require("../../obs/obsHelpers/obsHelpers");

const npCommands = (channel, tags, args, client, obs, url, config) => {
  console.log("NP COMMAND CONFIG: ")
  console.log(config)
  const scrapeSeratoData = async () => {
    try {
      await axios
        .get(url)
        .then(({ data }) => {
          const $ = cheerio.load(data);
          const results = $("div.playlist-trackname");
          const timestamp = $("div.playlist-tracktime");
          // check scrape results to see if they're empty
          // this will occur if the user/streamer isn't sending a live playlist to serato
          if (results.length === 0) {
            client.say(channel, "That doesn't seem to be working right now.");

            // !np (default)
          } else if (args.length === 0) {
            let nowplaying = results.last().text();
            client.say(channel, `Now playing: ${nowplaying.trim()}`);
            if (config.isObsResponseEnabled === true) {
              obs.call("SetInputSettings", {
                inputName: "obs-chat-response",
                inputSettings: {
                  text: `Now playing:\n${nowplaying.trim()}`,
                },
              });
              clearOBSResponse(obs);
            }
            // !np previous
          } else if (args == "previous") {
            let previousTrack = results[results.length - 2];
            client.say(
              channel,
              `Previous track: ${previousTrack.children[0].data.trim()}`
            );
            if (config.isObsResponseEnabled === true) {
              obs.call("SetInputSettings", {
                inputName: "obs-chat-response",
                inputSettings: {
                  text: `Previous song:\n${previousTrack.children[0].data.trim()}`,
                },
              });
              clearOBSResponse(obs);
            }
            // !np start
          } else if (args == "start") {
            let firstTrack = results.first().text();
            client.say(
              channel,
              `${
                tags.username
              } kicked off this stream with ${firstTrack.trim()}`
            );
            if (config.isObsResponseEnabled === true) {
              obs.call("SetInputSettings", {
                inputName: "obs-chat-response",
                inputSettings: {
                  text: `${
                    tags.username
                  } kicked off this stream with :\n${firstTrack.trim()}`,
                },
              });
              clearOBSResponse(obs);
            }
            // !np total
          } else if (args == "total") {
            // let currentTrack = results.last().text()
            client.say(
              channel,
              `${tags.username} has played ${results.length} tracks so far in this stream.`
            );
            // axios.post('http://192.168.86.50:8000/display', {
            //   total: new Number(results.length),
            //   current_track: currentTrack.trim()
            // })
            //   .then((response) => {
            //     console.log("Response from Pi: ", response.data)
            //   })
            //   .catch((error) => {
            //     console.log("ERROR: ", error)
            //   })

            // !np vibecheck
          } else if (args == "vibecheck") {
            // Select random index
            const randomIndex = Math.floor(Math.random() * results.length);
            const randomTrack = results[randomIndex];
            const randomTrackTimestamp =
              timestamp[randomIndex].children[0].data.trim();

            // Get current timestamp
            const currentTrackTimestamp = timestamp.last().text().trim();

            // Convert timestamps to Date objects
            const x = new Date(`Jan 1, 2022 ${currentTrackTimestamp}`);
            const y = new Date(`Jan 1, 2022 ${randomTrackTimestamp}`);

            // Calculate time difference
            const timeDifference = Math.abs(x - y) / 1000;
            const hours = Math.floor(timeDifference / 3600) % 24;
            const minutes = Math.floor(timeDifference / 60) % 60;
            const seconds = timeDifference % 60;

            // if random index timestamp has an hours value
            if (hours > 0) {
              // if that hours value is > 1
              if (hours > 1) {
                client.say(
                  channel,
                  `${
                    tags.username
                  } played "${randomTrack.children[0].data.trim()}" ${hours} hours & ${minutes} minutes ago in this stream.`
                );
                if (config.isObsResponseEnabled === true) {
                  obs.call("SetInputSettings", {
                    inputName: "obs-chat-response",
                    inputSettings: {
                      text: `vibecheck:\n\n${
                        tags.username
                      } played\n"${randomTrack.children[0].data.trim()}"\n${hours} hours & ${minutes} minutes ago in this stream.`,
                    },
                  });
                  clearOBSResponse(obs);
                }
              } else {
                client.say(
                  channel,
                  `${
                    tags.username
                  } played "${randomTrack.children[0].data.trim()}" ${hours} hour & ${minutes} minutes ago in this stream.`
                );
                if (config.isObsResponseEnabled === true) {
                  obs.call("SetInputSettings", {
                    inputName: "obs-chat-response",
                    inputSettings: {
                      text: `vibecheck:\n\n${
                        tags.username
                      } played\n"${randomTrack.children[0].data.trim()}"\n${hours} hour & ${minutes} minutes ago in this stream.`,
                    },
                  });
                  clearOBSResponse(obs);
                }
              }
            } else {
              client.say(
                channel,
                `${
                  tags.username
                } played "${randomTrack.children[0].data.trim()}" ${minutes} minutes ago in this stream.`
              );
              if (config.isObsResponseEnabled === true) {
                obs.call("SetInputSettings", {
                  inputName: "obs-chat-response",
                  inputSettings: {
                    text: `vibecheck:\n\n${
                      tags.username
                    } played\n"${randomTrack.children[0].data.trim()}"\n${minutes} minutes ago in this stream.`,
                  },
                });
                setTimeout(() => {
                  obs.call("SetInputSettings", {
                    inputName: "obs-chat-response",
                    inputSettings: {
                      text: "",
                    },
                  });
                }, 5000);
              }
            }

            // !np options
          } else if (args == "options") {
            client.say(
              channel,
              "Command Options: !np (current song), !np previous (previous song), !np start (first song), !np vibecheck (try it & find out), !stats, !doubles, !longestsong, !shortestsong"
            );
            // default catch-all for any args passed that are not defined
          } else {
            client.say(
              channel,
              "Command Options: !np (current song), !np start (first song), !np previous (previous song), !np vibecheck (random song we already played)"
            );
          }
        })
        .catch((error) => {
          // expand error checking here as needed (currently working for Serato errors)
          console.log(error);
          client.say(channel, "That doesn't appear to be working right now.");
        });
    } catch (err) {
      console.log(err);
      client.say(channel, "That doesn't appear to be working right now.");
      // add process.stderr.write statement to handle possible errors
    }
  };
  scrapeSeratoData();
};

module.exports = {
  npCommands: npCommands,
};
