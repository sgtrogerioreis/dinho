const { ConfigurationError } = require('../errors/configurationError');
const { PermissionDeniedError } = require('../errors/permissionDeniedError');

const GRAHAM_COMMAND_NAME = 'graham';

function createGrahamCommand(dependencies) {
  validateDependencies(dependencies);

  return {
    data: {
      name: GRAHAM_COMMAND_NAME,
    },
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

      return dependencies.analysisRenderer.render(analysisResult, {
        consultedAt: dependencies.now(),
      });
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
  dependencies.now = dependencies.now || (() => new Date());
}

function readUserId(interaction) {
  return interaction && interaction.user ? interaction.user.id : null;
}

module.exports = {
  GRAHAM_COMMAND_NAME,
  createGrahamCommand,
};
