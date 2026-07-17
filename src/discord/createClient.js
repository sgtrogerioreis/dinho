const { Client, GatewayIntentBits } = require('discord.js');

function createDiscordClient() {
  return new Client({
    intents: [GatewayIntentBits.Guilds],
  });
}

module.exports = {
  createDiscordClient,
};
