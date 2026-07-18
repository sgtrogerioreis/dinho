const { SlashCommandBuilder } = require('discord.js');
const { ConfigurationError } = require('../errors/configurationError');
const { PermissionDeniedError } = require('../errors/permissionDeniedError');

const grahamCommandData = new SlashCommandBuilder()
  .setName('graham')
  .setDescription('Calcula o preço justo de uma ação pelo método de Graham.')
  .addStringOption((option) =>
    option
      .setName('ticker')
      .setDescription('Ticker da ação brasileira, como PETR4.')
      .setRequired(true),
  );

function createGrahamCommand(dependencies) {
  validateDependencies(dependencies);

  return {
    data: grahamCommandData,
    async execute(interaction) {
      const startedAt = Date.now();
      const ticker = interaction.options.getString('ticker', true);

      if (!dependencies.permissionGuard.canRunAnalysis(interaction)) {
        throw new PermissionDeniedError(
          'Graham command is restricted during production validation.',
        );
      }

      const analysisResult = await dependencies.analyzeGrahamByTicker(
        ticker,
        dependencies.grahamProvider,
      );

      dependencies.logger.info('[analysis] graham command executed.', {
        user: readUserId(interaction),
        ticker: analysisResult.ticker,
        elapsedMs: Date.now() - startedAt,
        apiDurationMs: analysisResult.metadata.apiDurationMs ?? null,
        result: analysisResult.status,
      });

      return dependencies.analysisRenderer.render(analysisResult);
    },
  };
}

function validateDependencies(dependencies) {
  if (!dependencies || typeof dependencies !== 'object') {
    throw new ConfigurationError('Graham command dependencies are required.');
  }

  if (typeof dependencies.analyzeGrahamByTicker !== 'function') {
    throw new ConfigurationError('Graham command requires analyzeGrahamByTicker.');
  }

  if (
    !dependencies.grahamProvider ||
    typeof dependencies.grahamProvider.getGrahamInputsByTicker !== 'function'
  ) {
    throw new ConfigurationError('Graham command requires a valid Graham provider.');
  }

  if (
    !dependencies.analysisRenderer ||
    typeof dependencies.analysisRenderer.render !== 'function'
  ) {
    throw new ConfigurationError('Graham command requires an analysis renderer.');
  }

  if (
    !dependencies.permissionGuard ||
    typeof dependencies.permissionGuard.canRunAnalysis !== 'function'
  ) {
    throw new ConfigurationError('Graham command requires a permission guard.');
  }

  dependencies.logger = dependencies.logger || console;
}

function readUserId(interaction) {
  return interaction && interaction.user ? interaction.user.id : null;
}

module.exports = {
  createGrahamCommand,
  grahamCommandData,
};
