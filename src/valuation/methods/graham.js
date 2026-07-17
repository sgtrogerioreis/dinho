const { ValidationError } = require('../../errors/validationError');
const assumptions = require('../assumptions');
const { GRAHAM_FORMULA, GRAHAM_METHOD } = require('../constants');
const { ValuationResult } = require('../valuationResult');
const {
  calculateMarginOfSafety,
  ensurePositiveFiniteNumber,
  resolveValuationStatus,
} = require('../utils');

function calculateGrahamValuation(company) {
  validateGrahamCompany(company);

  const fairValue = Math.sqrt(
    assumptions.graham.grahamMultiplier * company.eps * company.bookValuePerShare,
  );

  if (!Number.isFinite(fairValue) || fairValue <= 0) {
    throw new ValidationError('Graham fair value must be a finite number greater than zero.');
  }

  const marginOfSafety = calculateMarginOfSafety(company.price, fairValue);
  const status = resolveValuationStatus(
    company.price,
    fairValue,
    assumptions.graham.fairValueTolerancePercentage,
  );

  return new ValuationResult({
    method: GRAHAM_METHOD,
    ticker: company.ticker,
    currentPrice: company.price,
    fairValue,
    marginOfSafety,
    status,
    inputs: {
      eps: company.eps,
      bookValuePerShare: company.bookValuePerShare,
    },
    assumptions: {
      grahamMultiplier: assumptions.graham.grahamMultiplier,
      fairValueTolerancePercentage: assumptions.graham.fairValueTolerancePercentage,
    },
    formula: GRAHAM_FORMULA,
  });
}

function validateGrahamCompany(company) {
  if (!company || typeof company !== 'object') {
    throw new ValidationError('Company is required for Graham valuation.');
  }

  if (typeof company.ticker !== 'string' || company.ticker.trim() === '') {
    throw new ValidationError('Company ticker is required for Graham valuation.');
  }

  ensurePositiveFiniteNumber(company.price, 'Current price');
  ensurePositiveFiniteNumber(company.eps, 'EPS');
  ensurePositiveFiniteNumber(company.bookValuePerShare, 'Book value per share');
}

module.exports = {
  calculateGrahamValuation,
};
