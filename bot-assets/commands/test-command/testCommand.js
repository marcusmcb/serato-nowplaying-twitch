const testCommand = (channel, tags, args, client) => {
  client.say(
    channel,
    'Your Twitch chat is properly linked to the npChatbot script!'
  )
}

module.exports = {
  testCommand: testCommand
}