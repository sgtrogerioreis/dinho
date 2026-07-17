const { readJsonFile } = require('../utils/file');
const { normalizeTicker } = require('../utils/ticker');
const { Company } = require('../models/company');
const { ConfigurationError } = require('../errors/configurationError');
const { CompanyProvider } = require('./companyProvider');

class LocalCompanyProvider extends CompanyProvider {
  constructor(options = {}) {
    super();
    if (!options.filePath) {
      throw new ConfigurationError('LocalCompanyProvider requires a filePath.');
    }

    this.filePath = options.filePath;
  }

  async getCompanyByTicker(ticker) {
    const normalizedTicker = normalizeTicker(ticker);
    const companies = await readJsonFile(this.filePath);
    const rawCompany = companies[normalizedTicker];

    if (!rawCompany) {
      return null;
    }

    return Company.fromRaw(rawCompany);
  }
}

module.exports = {
  LocalCompanyProvider,
};
