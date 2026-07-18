const GRAHAM_COMMAND_NAME = 'graham';

function createProductionCommandRegistry(options = {}) {
  const appConfig = options.appConfig;
  const logger = options.logger || console;
  let grahamCommand = null;

  return new Map([
    [
      GRAHAM_COMMAND_NAME,
      {
        data: {
          name: GRAHAM_COMMAND_NAME,
        },
        async execute(interaction) {
          if (!grahamCommand) {
            grahamCommand = createProductionGrahamCommand({ appConfig, logger });
          }

          return grahamCommand.execute(interaction);
        },
      },
    ],
  ]);
}

function createProductionGrahamCommand(options = {}) {
  const { createGrahamCommand } = require('../commands/graham');
  const { AnalysisEmbedRenderer } = require('../discord/renderers/analysisEmbedRenderer');
  const { PermissionGuard } = require('../permissions/permissionGuard');
  const { BolsaiGrahamProvider } = require('../providers/bolsai/grahamProvider');
  const { analyzeGrahamByTicker } = require('../services/analyzeGraham');

  return createGrahamCommand({
    analysisRenderer: new AnalysisEmbedRenderer(),
    analyzeGrahamByTicker,
    grahamProvider: new BolsaiGrahamProvider(options.appConfig.companyProvider.bolsai),
    permissionGuard: new PermissionGuard(options.appConfig.permissions),
    logger: options.logger,
  });
}

module.exports = {
  GRAHAM_COMMAND_NAME,
  createProductionCommandRegistry,
  createProductionGrahamCommand,
};
