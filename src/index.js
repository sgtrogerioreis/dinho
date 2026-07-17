require('dotenv').config();

const { Events } = require('discord.js');
const config = require('./config');
const { createCommandRegistry } = require('./discord/commandRegistry');
const { createDiscordClient } = require('./discord/createClient');
const { formatGrahamResponse } = require('./discord/formatters/grahamResponse');
const { createInteractionHandler } = require('./discord/handleInteraction');
const { createCompanyProvider } = require('./providers');
const { calculateGrahamValuationByTicker } = require('./services');

async function bootstrap() {
  const discordConfig = config.discord.getDiscordRuntimeConfig();
  const provider = createCompanyProvider(config.app.companyProvider);
  const commandRegistry = createCommandRegistry({
    calculateGrahamValuationByTicker,
    companyProvider: provider,
    formatGrahamResponse,
  });
  const client = createDiscordClient();
  const handleInteraction = createInteractionHandler(commandRegistry);

  client.once(Events.ClientReady, () => {
    console.log('DINHO conectado ao Discord.');
  });

  client.on(Events.InteractionCreate, handleInteraction);

  registerShutdownHandlers(client);
  await client.login(discordConfig.token);
}

bootstrap().catch((error) => {
  console.error('Failed to initialize DINHO.', error);
  process.exitCode = 1;
});

function registerShutdownHandlers(client) {
  let hasShutdownStarted = false;

  async function shutdown(signal) {
    if (hasShutdownStarted) {
      return;
    }

    hasShutdownStarted = true;
    console.log(`Received ${signal}. Shutting down DINHO.`);

    try {
      client.destroy();
    } finally {
      process.exit(0);
    }
  }

  process.once('SIGINT', () => {
    void shutdown('SIGINT');
  });

  process.once('SIGTERM', () => {
    void shutdown('SIGTERM');
  });
}
