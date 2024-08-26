### npChatbot for Serato DJ Pro & Twitch

This repo contains a complete chatbot solution for DJs streaming live sets on Twitch that adds a suite of chat commands which allow your viewers to interact with your Serato play history in real-time as you play tracks.

This is done by use of the TMI.js library to connect the chatbot to your Twitch channel and the Live Playlist feature in Serato DJ Pro to transmit track info for each track played during your set.

The desktop app is written with Node/TypeScript and packaged via Electron.

<hr>

### Chat Commands:

* !np - returns the title/artist of the currently playing song
* !np previous - returns the title/artist of the previously played song
* !np start - returns the title/artist of the song you began your set with
* !np vibecheck - returns the title/artist of a random entry from your play history and how long ago you played it
* !dyp (artist name) - returns how many times the query (title or artist) has been played previously in the stream
* !stats - returns the total number of songs played in the stream, the average track length, and how that average has changed since the previous track
* !doubles - returns the total number of times you've played doubles (the same song playing on both decks simultaneously) and the title/artist of the most recent doubles set you've played
* !shortestsong - returns the title/artist/length of the shortest song in your set so far
* !longestsong - returns the title/artist/length of the longest song in your set so far
* !test - utility command to test communication with this script via Twitch

<hr>

### Authorizing via Twitch:

When starting the app for the first time, in the upper left hand of the client UI, you'll see an option to authorize the app with Twitch.  After clicking the link, you'll be prompted to authorize the app and, once completed, you'll be returned to npChatbot with an update to note that the app is now authorized.

<b>NOTE:</b> Most live-streamers on Twitch will typically use a second, dedicated chatbot account for utilities such as npChatbot, but the app can be configured to use your primary Twitch channel to receive npChatbot's responses.

If you're using a dedicated chatbot account for this app, the chatbot account <i>must</i> be set as a moderator for your primary channel in order for it to work.

<hr>

### User Credentials

Once authorized, you can then enter in your user credentials:

* Twitch Channel Name (your primary streaming channel)
* Twitch Chatbot Name (your chatbot account for your primary streaming channel)
* Serato Display Name (your Serato user profile name)
* OBS Websocket Address & Password (optional - see below)

<hr>

### OBS Websocket & Password (optional)

To display command responses on-screen via OBS during your livestream, you'll need to set up and configure a <a href="https://obsproject.com/forum/resources/obs-websocket-remote-control-obs-studio-using-websockets.466/">web socket</a> connection for OBS.

Once done, you can store the OBS websocket address and password (if secured) values in the npChatbot app's Credentials section which will then enable the "Enable On-Screen OBS Responses" option in the Preferences section.  

<hr>

### Enable On-Screen OBS Responses (optional)

This setting determines how long the text response from npChatbot will appear on-screen in OBS before clearing; a value of 5 seconds is set by default if this option is enabled but no value is entered.

The OBS responses are configured within the chatbot script to return its responses to a common TextGDI+ element named ``'obs-chat-response'``. You can easily create this element and set its name and add it to any scene in your OBS collection.  

Font size/color, element sizing, and placement are <b>not</b> programmatically set by this script; you'll need to make these determinations for best use within your own Twitch stream.

<hr>

### Automated/Interval Messages (optional)

In the Preferences section, when "Enable Interval Message" is enabled, npChatbot will periodically add a message to your chat that prompts your viewers to try out the various npChatbot commands.  

The "interval duration" value (given in minutes) determines how often these message will appear if enabled; a value of 15 minutes is set by default if this option is enabled but no value is entered.

<hr>

### Enabling/Starting a Serato Live Playlist

In order for this script to work properly, you'll need to be familiar with how to start a <a href='https://support.serato.com/hc/en-us/articles/228019568-Live-Playlists'>Live Playlist</a> session in Serato DJ Pro, a feature which allows you to transmit your real-time playlist data to the web.

After starting the live playlist, your Serato profile will pop up in a new browser window.  Click the "start live playlist" button by scrolling down a bit.  Once done, click the "edit details" button to the right and make sure the playlist is set to "public" (Serato sets this to "private" by default).  

Save the changes and begin playing tracks in your Serato DJ software.  You should begin to see the tracks played in the Serato live playlist window in your browser; at this point, the npChatbot commands should behave as expected when used in your Twitch channel's chat.

NOTE: To ensure the accuracy of the analysis in several commands' responses, the Live Playlist should be started roughly the same time that your live stream does.

<hr>

### Chatbot Controls

Once your user credentials and preferences have been set, click "Connect" to start the npChatbot script.  The Session Info panel will update to display the current connection status and uptime.  

With a Serato Live Playlist successfully running, you'll now be able to use all of the commands within the npChatbot app in your Twitch chat while live-streaming.

When you've completed your live stream, simply click "End Session" to disconnect the npChatbot script.

<hr>

### Development Stack:

* React/TypeScript (client UI)
* Electron (back-end logic, API, and handlers)
* NodeJS (chatbot scripting and playlist analysis)
* Twitch API / TMI.js (app authorization & chat event listeners)
* OBS-Websocket-JS (OBS data integration)

<hr>

### A note on file tags:

The tidier your audio file tags are, the better.  However that text appears in your Serato is how it'll appear in the chat.  Just a heads up.

<hr>

### Testing:

Tested and verified working using Serato DJ Pro 3.0.2 and OBS Studio 29.0.2 (64-bit) on Windows 10/11.  

<hr>

#### Questions:

Feel free to message me with any questions regrading the app, configuration/setup, or feature requests to expand the core concept here.

<hr>

#### The idea here...

To build out a set of interactive analysis tools for your Twitch viewers to see what music you're currently playing or have previously played in your live stream DJ sets using Serato.  

Marcus McBride, 2024.
