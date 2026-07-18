require('dotenv').config();

const { Events } = require('discord.js');
const config = require('./config');
const { createCommandRegistry } = require('./discord/commandRegistry');
const { createDiscordClient } = require('./discord/createClient');
const { AnalysisEmbedRenderer } = require('./discord/renderers/analysisEmbedRenderer');
const { createInteractionHandler } = require('./discord/handleInteraction');
const { PermissionGuard } = require('./permissions/permissionGuard');
const { BolsaiGrahamProvider } = require('./providers/bolsai');
const { analyzeGrahamByTicker } = require('./services');
const { serializeError } = require('./utils/errorDetails');

async function bootstrap() {
  const discordConfig = config.discord.getDiscordRuntimeConfig();
  const grahamProvider = new BolsaiGrahamProvider(config.app.companyProvider.bolsai);
  const commandRegistry = createCommandRegistry({
    analysisRenderer: new AnalysisEmbedRenderer(),
    analyzeGrahamByTicker,
    grahamProvider,
    permissionGuard: new PermissionGuard(config.app.permissions),
    logger: console,
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
  console.error('Failed to initialize DINHO.', serializeError(error));
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
