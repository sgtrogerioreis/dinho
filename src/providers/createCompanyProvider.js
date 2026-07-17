const { ConfigurationError } = require('../errors/configurationError');
const { MissingCredentialError } = require('../errors/missingCredentialError');
const { ApiCompanyProvider } = require('./apiProvider');
const { LocalCompanyProvider } = require('./localProvider');

function createCompanyProvider(config) {
  if (!config || typeof config !== 'object') {
    throw new ConfigurationError('Provider configuration is required.');
  }

  if (config.driver === 'local') {
    return new LocalCompanyProvider({
      filePath: config.local.filePath,
    });
  }

  if (config.driver === 'api') {
    if (!config.api || typeof config.api !== 'object') {
      throw new ConfigurationError('API provider configuration is required.');
    }

    if (!config.api.apiKey) {
      throw new MissingCredentialError('BRAPI_API_KEY is required when PROVIDER=api.');
    }

    return new ApiCompanyProvider({
      baseUrl: config.api.baseUrl,
      apiKey: config.api.apiKey,
      timeoutMs: config.api.timeoutMs,
    });
  }

  throw new ConfigurationError(`Unsupported company provider driver: ${config.driver}`);
}

module.exports = {
  createCompanyProvider,
};
