const { SlashCommandBuilder } = require('discord.js');
const { ConfigurationError } = require('../errors/configurationError');

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
      const ticker = interaction.options.getString('ticker', true);
      const valuationResult = await dependencies.calculateGrahamValuationByTicker(
        ticker,
        dependencies.companyProvider,
      );

      return dependencies.formatGrahamResponse(valuationResult);
    },
  };
}

function validateDependencies(dependencies) {
  if (!dependencies || typeof dependencies !== 'object') {
    throw new ConfigurationError('Graham command dependencies are required.');
  }

  if (typeof dependencies.calculateGrahamValuationByTicker !== 'function') {
    throw new ConfigurationError('Graham command requires calculateGrahamValuationByTicker.');
  }

  if (
    !dependencies.companyProvider ||
    typeof dependencies.companyProvider.getCompanyByTicker !== 'function'
  ) {
    throw new ConfigurationError('Graham command requires a valid company provider.');
  }

  if (typeof dependencies.formatGrahamResponse !== 'function') {
    throw new ConfigurationError('Graham command requires formatGrahamResponse.');
  }
}

module.exports = {
  createGrahamCommand,
  grahamCommandData,
};
