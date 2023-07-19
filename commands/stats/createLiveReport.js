const scrapeData = require("./LiveReportHelpers/scrapeData");
const parseTimeValues = require("./LiveReportHelpers/parseTimeValues");
const parseStartTime = require("./LiveReportHelpers/parseStartTime");
const calculateAverageTime = require("./LiveReportHelpers/calculateAverageTime");
const {
  extractPlaylistName,
  parseDateAndTime,
  createPlaylistDate,
  convertTo24Hour,
  formatTimeSincePlayedString,
  calculateTimeDifference,
  compareTimes,
  sumTimeValues,
} = require("./LiveReportHelpers/liveReportHelpers");
// const compareTimes = require("./LiveReportHelpers/liveReportHelpers");

const createLiveReport = async (url) => {
  const playlistArtistName = extractPlaylistName(url);

  try {
    // function to scrape data for report
    let response = await scrapeData(url);
    let results = response[0];
    let timestamps = response[1];
    let starttime = response[2];
    let playlistdate = response[3];
    let playlistTitle = response[4];
    let tracksPlayed = [];
    let trackTimestamps = [];
    let doublesPlayed = [];
    let timestampsParsed = [];
    let startTimeString;
    let starttimeParsed = createPlaylistDate(starttime, playlistdate);

    // parse start time for proper display in UI
    if (starttime.length === 7) {
      const [first, second] = parseStartTime(starttime, 5);
      startTimeString = first + " " + second.toUpperCase();
    } else {
      const [first, second] = parseStartTime(starttime, 4);
      startTimeString = first + " " + second.toUpperCase();
    }

    // loop through tracks played and clean data from scrape
    for (let i = 0; i < results.length; i++) {
      let trackId = results[i].children[0].data.trim();
      tracksPlayed.push(trackId);
    }

    // loop through track timestamps and clean data from scrape
    for (let j = 0; j < results.length; j++) {
      let timestamp = timestamps[j].children[0].data.trim();
      let timestampParsed = parseDateAndTime(timestamp, playlistdate);
      timestamp = new Date("01/01/1970 " + timestamp);
      timestampsParsed.push(timestampParsed);
      trackTimestamps.push(timestamp);
    }

    // determine lengths of each track played
    let timeDiffs = [];
    for (let k = 0; k < trackTimestamps.length; k++) {
      let x = trackTimestamps[k + 1] - trackTimestamps[k];
      if (Number.isNaN(x)) {
      } else {
        timeDiffs.push(x);
      }
    }

    // check for doubles and add those tracks to array
    for (let n = 0; n < tracksPlayed.length; n++) {
      if (tracksPlayed[n] === tracksPlayed[n + 1]) {
        doublesPlayed.push({
          name: tracksPlayed[n],
        });
      }
    }

    // master track log
    let trackLog = tracksPlayed.map((result, index) => {
      return {
        trackId: result,
        timestamp: sumTimeValues(starttimeParsed, timestampsParsed[index]),
        timePlayed: timestamps[index].children[0].data.trim(),
        length: timeDiffs[index],
      };
    });

    // create an array of track lengths in MS and send to
    // calculateAverageTime to convert and return average
    let msArray = [];

    for (let i = 0; i < trackLog.length - 1; i++) {
      msArray.push(trackLog[i]["length"]);
    }

    let lastMSArray = msArray.slice(0, -1);
    let averageTrackLength = calculateAverageTime(msArray);
    let previousAverageTrackLength = calculateAverageTime(lastMSArray);
    console.log(averageTrackLength);
    console.log(previousAverageTrackLength);
    let averageDifference = compareTimes(
      averageTrackLength,
      previousAverageTrackLength
    );

    // longest track played
    let longestSeconds;
    let max = Math.max(...timeDiffs);
    let maxIndex = timeDiffs.indexOf(max);
    let longestTrack = Math.abs(
      (trackTimestamps[maxIndex] - trackTimestamps[maxIndex + 1]) / 1000
    );
    let longestMinutes = Math.floor(longestTrack / 60) % 60;
    let tempLongestSeconds = longestTrack % 60;

    // check length of longest seconds for display parsing
    if (tempLongestSeconds.toString().length === 1) {
      longestSeconds = "0" + tempLongestSeconds;
    } else {
      longestSeconds = tempLongestSeconds;
    }

    // shortest track played
    let shortestSeconds;
    let min = Math.min(...timeDiffs);
    let minIndex = timeDiffs.indexOf(min);
    let shortestTrack = Math.abs(
      (trackTimestamps[minIndex] - trackTimestamps[minIndex + 1]) / 1000
    );
    let shortestMinutes = Math.floor(shortestTrack / 60) % 60;
    let tempShortestSeconds = shortestTrack % 60;

    // check length of shortest seconds for display parsing
    if (tempShortestSeconds.toString().length === 1) {
      shortestSeconds = "0" + tempShortestSeconds;
    } else {
      shortestSeconds = tempShortestSeconds;
    }

    // playlist length & parse hours/minutes/seconds
    let playlistLength = timestamps.last().text().trim();
    let playlistLengthValues = parseTimeValues(playlistLength);

    // playlist date formatting
    let playlistDateFormatted =
      playlistdate.split(" ")[1] +
      " " +
      playlistdate.split(" ")[0] +
      ", " +
      playlistdate.split(" ")[2];

    const longestTrackDifference = calculateTimeDifference(
      trackLog[trackLog.length - 1].timestamp,
      trackLog[maxIndex].timestamp
    );
    const shortestTrackDifference = calculateTimeDifference(
      trackLog[trackLog.length - 1].timestamp,
      trackLog[minIndex].timestamp
    );

    let timeSinceLongestPlayed = formatTimeSincePlayedString(
      longestTrackDifference
    );
    let timeSinceShortestPlayed = formatTimeSincePlayedString(
      shortestTrackDifference
    );

    let seratoLiveReport = {
      track_length_array: timeDiffs,
      dj_name: playlistArtistName,
      set_length: {
        length_value: playlistLength,
        hours: new Number(playlistLengthValues[0]),
        minutes: new Number(playlistLengthValues[1]),
        seconds: new Number(playlistLengthValues[2]),
      },
      set_start_time: startTimeString,
      total_tracks_played: trackLog.length,
      longest_track: {
        name: trackLog[maxIndex].trackId,
        played_at: trackLog[maxIndex].timestamp,
        time_since_played: calculateTimeDifference(
          trackLog[trackLog.length - 1].timestamp,
          trackLog[maxIndex].timestamp
        ),
        time_since_played_string: timeSinceLongestPlayed,
        length_value: longestMinutes + ":" + longestSeconds,
        minutes: longestMinutes,
        seconds: longestSeconds,
      },
      shortest_track: {
        name: trackLog[minIndex].trackId,
        played_at: trackLog[minIndex].timestamp,
        time_since_played: calculateTimeDifference(
          trackLog[trackLog.length - 1].timestamp,
          trackLog[minIndex].timestamp
        ),
        time_since_played_string: timeSinceShortestPlayed,
        length_value: shortestMinutes + ":" + shortestSeconds,
        minutes: shortestMinutes,
        seconds: shortestSeconds,
      },
      average_track_length: averageTrackLength,
      average_change: {
        isLarger: averageDifference.averageIncrease,
        difference: averageDifference.difference,
      },
      track_log: trackLog,
      doubles_played: doublesPlayed,
      playlist_date: playlistDateFormatted,
      playlist_title: playlistTitle,
      track_array: tracksPlayed,
    };
    return seratoLiveReport;
  } catch (err) {
    console.log(err);
  }
};
// FUTURE DEV NOTES
//
// calculate average tracks per hour for longer sets
//
// check if shortest track is part of a doubles pair
//
// add logic to determine longest track played @ time
// add logic to determine shortest track played @ time

module.exports = createLiveReport;
