const dypInfo = (channel, tags, args, client) => {
  client.say(
    channel,
    "You can search my play history any time using the !dyp command (Did you play...?).  Enter the command followed by the title/artist you want to search for to see if I've played it."
  );
};

const npInfo = (channel, tags, args, client) => {
  client.say(
    channel,
    "If you want to know what song is now playing, enter !np in the chat to find out.  If you want to know what song was played before the current one, enter !np previous in the chat to find out."
  );
};

const statsInfo = (channel, tags, args, client) => {
  client.say(
    channel,
    "You can look up the playlist stats for this stream any time with the !stats command.  It'll show you how many songs I've played so far, the average song length, and whether that average has gone up or down since the last song."
  );
};

const lightsInfo = (channel, tags, args, client) => {
  client.say(
    channel,
    "You can control my smart lighting by entering !lights and any of the following options: on, off, random, morph, green, blue, red, purple, pink, teal, gold, peach "
  );
};

module.exports = {
  dypInfo: dypInfo,
  npInfo: npInfo,
  statsInfo: statsInfo,
  lightsInfo: lightsInfo,
};
