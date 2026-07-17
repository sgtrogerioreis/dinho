const { ConfigurationError } = require('../errors/configurationError');

function getDiscordRuntimeConfig() {
  return Object.freeze({
    token: readRequiredEnvironmentVariable('DISCORD_TOKEN'),
  });
}

function getDiscordCommandRegistrationConfig() {
  return Object.freeze({
    token: readRequiredEnvironmentVariable('DISCORD_TOKEN'),
    clientId: readRequiredEnvironmentVariable('DISCORD_CLIENT_ID'),
    guildId: readRequiredEnvironmentVariable('DISCORD_GUILD_ID'),
  });
}

function readRequiredEnvironmentVariable(variableName) {
  const value = process.env[variableName];

  if (typeof value !== 'string' || value.trim() === '') {
    throw new ConfigurationError(`Missing required environment variable: ${variableName}.`);
  }

  return value.trim();
}

module.exports = {
  getDiscordCommandRegistrationConfig,
  getDiscordRuntimeConfig,
};
