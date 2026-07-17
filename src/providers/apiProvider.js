const { ConfigurationError } = require('../errors/configurationError');
const { MissingCredentialError } = require('../errors/missingCredentialError');
const { CompanyProvider } = require('./companyProvider');
const { BrapiHttpClient } = require('./brapi/httpClient');
const { mapBrapiCompanyDataToCompany } = require('./brapi/mapCompany');

class ApiCompanyProvider extends CompanyProvider {
  constructor(options = {}) {
    super();

    if (!options.baseUrl) {
      throw new ConfigurationError('ApiCompanyProvider requires a baseUrl.');
    }

    if (!options.brapiClient && !options.apiKey) {
      throw new MissingCredentialError(
        'ApiCompanyProvider requires BRAPI_API_KEY when PROVIDER=api.',
      );
    }

    this.brapiClient =
      options.brapiClient ||
      new BrapiHttpClient({
        baseUrl: options.baseUrl,
        apiKey: options.apiKey,
        timeoutMs: options.timeoutMs,
      });
  }

  async getCompanyByTicker(ticker) {
    const quoteResult = await this.brapiClient.getQuote(ticker);
    const statisticsResult = await this.brapiClient.getStatistics(ticker);

    return mapBrapiCompanyDataToCompany(quoteResult, statisticsResult);
  }
}

module.exports = {
  ApiCompanyProvider,
};
