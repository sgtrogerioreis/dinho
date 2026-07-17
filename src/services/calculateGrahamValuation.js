const { NotFoundError } = require('../errors/notFoundError');
const { ValidationError } = require('../errors/validationError');
const { normalizeTicker } = require('../utils/ticker');
const { calculateGrahamValuation } = require('../valuation');

async function calculateGrahamValuationByTicker(ticker, companyProvider) {
  if (!companyProvider || typeof companyProvider.getCompanyByTicker !== 'function') {
    throw new ValidationError('A company provider with getCompanyByTicker is required.');
  }

  const normalizedTicker = normalizeTicker(ticker);
  const company = await companyProvider.getCompanyByTicker(normalizedTicker);

  if (!company) {
    throw new NotFoundError(`Company not found for ticker "${normalizedTicker}".`);
  }

  return calculateGrahamValuation(company);
}

module.exports = {
  calculateGrahamValuationByTicker,
};
