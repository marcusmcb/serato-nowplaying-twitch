### npChatbot for Serato DJ Pro & Twitch

This repo contains a complete chatbot solution for DJs streaming live sets on Twitch that adds a suite of chat commands that allow your viewers to interact with your Serato play history in real-time as you play tracks.

This is done by use of the TMI.js library to connect the chatbot to your Twitch channel and the Live Playlist feature in Serato DJ Pro to transmit track info for each track played during your set.

<hr>

#### Chat Commands:

* !test - utility command to test communication with this script via Twitch
* !np - returns the title/artist of the currently playing song
* !np previous - returns the title/artist of the previously played song
* !np start - returns the title/artist of the song you began your set with
* !np vibecheck - returns the title/artist of a random entry from your play history and how long ago you played
* !np total - returns the total number of tracks played so far during the stream
* !dyp (artist name) - returns how many times the query (title or artist) has been played previously in the stream
* !stats - returns the total number of songs played in the stream, the average track length, and how that average has changed since the previous track
* !doubles - returns the total number of times you've played doubles (the same song playing on both decks simultaneously) and the title/artist of the most recent doubles set you've played
* !shortestsong - returns the title/artist/length of the shortest song in your set so far
* !longestsong - returns the title/artist/length of the longest song in your set so far

<hr>

#### Text & OBS Responses:

Each command's response will be returned to the streamer's Twitch chat as text with the option to also display the response on-screen using OBS Studio.

<hr>

#### What You'll Need:

* <a href='https://nodejs.org/en/'>Node 18.x</a>
* <a href='https://serato.com/dj/pro'>Serato DJ Pro</a>

<hr>

#### Config: Enabling/Starting a Serato Live Playlist

In order for this script to work properly, you'll need to be familiar with how to start a <a href='https://support.serato.com/hc/en-us/articles/228019568-Live-Playlists'>Live Playlist</a> session in Serato DJ Pro.  Specific details are provided in the "in use" section in this documentation.

To ensure the accuracy of the analysis in several commands' responses, the Live Playlist should be started roughly the same time that your live stream does.

<hr>

#### Config: Twitch OAuth token (connecting via the tmi.js client)

To connect the tmi.js client to your Twitch channel, you'll need to generate an <a href="https://twitchapps.com/tmi/">OAuth Token</a>.  

Copy and paste this value into a <a href='https://www.npmjs.com/package/dotenv'>.env file</a> in this repo's root directory.  

We'll use this to secure our environment variables for both our Twitch account and our Serato profile display name as follows:

`TWITCH_OAUTH_TOKEN='your_oauth_token_value'`

`TWITCH_BOT_USERNAME='the_name_of_the_bot_account'`

`TWITCH_CHANNEL_NAME='your_main_channel's_name'`

<hr>

#### Config: Serato Playlists Display Name 

You'll also need to set an environment variable for your Serato profile's display name.  

If you sign in to your account on the Serato website and navigate to 'My Playlists' and select any public playlist from your profile, your display name can be found just after <b>/playlists/</b> in your browser's url.

Example:

`https://www.serato.com/playlists/DJ_User_Name/playlist_name`

Copy your profile display name and store it in your .env file as follows (include any underscores in your profile display name):

`SERATO_DISPLAY_NAME="your_serato_profile_display_name"`

<hr>

#### Config: OBS Web Socket (optional)

To display command responses on-screen via OBS during your livestream, you'll need to set up and configure a <a href="https://obsproject.com/forum/resources/obs-websocket-remote-control-obs-studio-using-websockets.466/">web socket</a> connection for OBS.

Once done, store your OBS web socket address and password as environment variables as follows: 

`OBS_WEBSOCKET_ADDRESS='ws://192.168.86.40:4455'`

`OBS_WEBSOCKET_PASSWORD='Q4f0ZTLerOb7dgru'`

The OBS responses are configured within the chatbot script to return its responses to a common TextGDI+ element named `'obs-chat-response'``. You can easily create this element and set its name and add it to any scene in your OBS collection.  

Font size/color, element sizing, and placement are <b>not</b> programmatically set by this script; you'll need to make these determinations for best use within your own Twitch stream.

<hr>

#### Config: Display OBS Messages

If you'd like to display the responses from these commands on-screen in OBS during your livestream, you have the option to display how long each response will be displayed on-screen before cleared.  Set the following values in your .env file to enable/disable them and their on-screen duration (in MS).

`DISPLAY_OBS_MESSAGES=true`

`OBS_DISPLAY_DURATION='5000'`

<hr>

#### Config: Automated/Interval Messages

This chatbot script has the option to display automated 'helper' messages during your livestream that show viewers what options are available and how to use them in the chat (text only, no OBS display for these messages).

Set the following options in your .env file to enable them and their interval (in MS) or disable them.

`DISPLAY_INTERVAL_MESSAGES=true`

`AUTO_COMMAND_INTERVAL='300000'`

<hr>

#### Node Dependencies:

* axios
* cheerio
* dotenv
* tmi.js
* obs-websocket-js
* nodemon (optional)

<hr>

#### In use (chatbot script & Serato Live Playlist start-up):

After cloning the repo and adding the necessary .env to secure your credentials, run "npm install" to add the necessary dependencies, and then "nodemon index.js" from the root directory to start the script.

To ensure the script is working, start a Serato live playlist stream by following the directions <a href="https://support.serato.com/hc/en-us/articles/228019568-Live-Playlists">here</a>.  

After starting the playlist stream, your Serato profile will pop up in a new browser window.  Click the "start live playlist" button by scrolling down a bit.  Once done, click the "edit details" button to the right and make sure the playlist is set to "public" (Serato sets this to "private" by default).  

Save the changes and begin playing tracks in your Serato DJ software.  You should begin to see the tracks played in the Serato live playlist window in your browser; at this point, the !np command should behave as expected when used in your Twitch channel's chat.

#### A note on file tags:

The tidier your audio file tags are, the better.  However that text appears in your Serato is how it'll appear in the chat.  Just a heads up.

<hr>

#### Testing:

Tested and verified working using Serato DJ Pro 3.0.2 and OBS Studio 29.0.2 (64-bit).  

I've run the script during live streams locally using a RPi4 without issue, though performance and command response times typically improve when running the script from a well-spec'd device or cloud service.

The Procfile is included for easy deployment to Heroku, also testing.  To use the OBS responses via cloud deployment, you'll need to configure a proxy to connect to your local OBS websocket (feature in development).

<hr>

#### Questions:

Feel free to message me with any questions regrading the script, configs/setup, or feature requests to expand the concept here.

<hr>

#### The idea here...

To build out a set of interactive analysis tools for your Twitch viewers to see what music you're currently playing or have previously played in your live stream DJ sets using Serato.  

Marcus McBride, 2023.
