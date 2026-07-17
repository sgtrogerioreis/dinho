const { mapInteractionError } = require('./mapInteractionError');
const { safeReply } = require('./safeReply');
const { serializeError } = require('../utils/errorDetails');

function createInteractionHandler(commandRegistry) {
  return async function handleInteraction(interaction) {
    if (!interaction.isChatInputCommand()) {
      return;
    }

    const command = commandRegistry.get(interaction.commandName);

    if (!command) {
      return;
    }

    try {
      const payload = await command.execute(interaction);
      await safeReply(interaction, payload);
    } catch (error) {
      logInteractionError(interaction, error);
      await safeReply(interaction, mapInteractionError(error));
    }
  };
}

function logInteractionError(interaction, error) {
  console.error(
    `[discord] command "${interaction.commandName}" failed for ticker option "${readTickerOption(interaction)}".`,
    serializeError(error),
  );
}

function readTickerOption(interaction) {
  try {
    return interaction.options.getString('ticker');
  } catch {
    return null;
  }
}

module.exports = {
  createInteractionHandler,
};
