require('dotenv').config({ quiet: true });

const { Events } = require('discord.js');
const config = require('./config');
const { createDiscordClient } = require('./discord/createClient');
const { createInteractionHandler } = require('./discord/handleInteraction');
const { registerLifecycleDiagnostics } = require('./runtime/lifecycleDiagnostics');
const { createProductionCommandRegistry } = require('./runtime/productionCommandRegistry');
const { registerShutdownHandlers } = require('./runtime/shutdownHandlers');
const { serializeError } = require('./utils/errorDetails');

async function bootstrap() {
  const discordConfig = config.discord.getDiscordRuntimeConfig();
  const commandRegistry = createProductionCommandRegistry({
    appConfig: config.app,
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
