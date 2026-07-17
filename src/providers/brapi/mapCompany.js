const { FundamentalDataUnavailableError } = require('../../errors/fundamentalDataUnavailableError');
const { ValidationError } = require('../../errors/validationError');
const { Company } = require('../../models/company');

function mapBrapiCompanyDataToCompany(quoteResult, statisticsResult) {
  validateBrapiResult(quoteResult, 'quote');
  validateBrapiResult(statisticsResult, 'statistics');
  validateGrahamFields(quoteResult, statisticsResult);

  const companyData = {
    ticker: quoteResult.symbol,
    name: quoteResult.data.longName || quoteResult.data.shortName || quoteResult.symbol,
    price: quoteResult.data.regularMarketPrice,
    eps: statisticsResult.data.earningsPerShare,
    bookValuePerShare: statisticsResult.data.bookValue,
    annualDividend: 0,
    fcf: 0,
    sharesOutstanding: statisticsResult.data.sharesOutstanding || 0,
    netDebt: 0,
  };

  return Company.fromRaw(companyData);
}

function validateBrapiResult(result, resultName) {
  if (!result || typeof result !== 'object') {
    throw new ValidationError(`BRAPI ${resultName} result is required.`);
  }

  if (typeof result.symbol !== 'string' || result.symbol.trim() === '') {
    throw new ValidationError(`BRAPI ${resultName} result symbol is required.`);
  }

  if (!result.data || typeof result.data !== 'object') {
    throw new ValidationError(`BRAPI ${resultName} result data is required.`);
  }
}

function validateGrahamFields(quoteResult, statisticsResult) {
  if (!Number.isFinite(quoteResult.data.regularMarketPrice)) {
    throw new FundamentalDataUnavailableError(
      `BRAPI quote does not provide a valid regularMarketPrice for ticker "${quoteResult.symbol}".`,
    );
  }

  if (!Number.isFinite(statisticsResult.data.earningsPerShare)) {
    throw new FundamentalDataUnavailableError(
      `BRAPI statistics do not provide a valid earningsPerShare for ticker "${statisticsResult.symbol}".`,
    );
  }

  if (!Number.isFinite(statisticsResult.data.bookValue)) {
    throw new FundamentalDataUnavailableError(
      `BRAPI statistics do not provide a valid bookValue for ticker "${statisticsResult.symbol}".`,
    );
  }
}

module.exports = {
  mapBrapiCompanyDataToCompany,
};
