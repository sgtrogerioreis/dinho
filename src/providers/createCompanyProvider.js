const { ConfigurationError } = require('../errors/configurationError');
const { LocalCompanyProvider } = require('./localProvider');

function createCompanyProvider(config) {
  if (!config || typeof config !== 'object') {
    throw new ConfigurationError('Provider configuration is required.');
  }

  if (config.driver === 'local') {
    return new LocalCompanyProvider({
      filePath: config.filePath,
    });
  }

  throw new ConfigurationError(`Unsupported company provider driver: ${config.driver}`);
}

module.exports = {
  createCompanyProvider,
};
