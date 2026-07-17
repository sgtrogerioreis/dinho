require('dotenv').config();

const { REST, Routes } = require('discord.js');
const config = require('../src/config');
const { getCommandDefinitions } = require('../src/discord/commandRegistry');

async function registerCommands() {
  const discordConfig = config.discord.getDiscordCommandRegistrationConfig();
  const rest = new REST({ version: '10' }).setToken(discordConfig.token);
  const commandDefinitions = getCommandDefinitions();

  await rest.put(Routes.applicationGuildCommands(discordConfig.clientId, discordConfig.guildId), {
    body: commandDefinitions,
  });

  console.log(`Successfully registered ${commandDefinitions.length} guild command(s) for DINHO.`);
}

registerCommands().catch((error) => {
  console.error('Failed to register DINHO slash commands.', error);
  process.exitCode = 1;
});
