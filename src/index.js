require('dotenv').config({ quiet: true });

const { Events } = require('discord.js');
const config = require('./config');
const { createCommandRegistry } = require('./discord/commandRegistry');
const { createDiscordClient } = require('./discord/createClient');
const { AnalysisEmbedRenderer } = require('./discord/renderers/analysisEmbedRenderer');
const { createInteractionHandler } = require('./discord/handleInteraction');
const { PermissionGuard } = require('./permissions/permissionGuard');
const { BolsaiGrahamProvider } = require('./providers/bolsai');
const { registerLifecycleDiagnostics } = require('./runtime/lifecycleDiagnostics');
const { registerShutdownHandlers } = require('./runtime/shutdownHandlers');
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

  registerLifecycleDiagnostics(client);

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
