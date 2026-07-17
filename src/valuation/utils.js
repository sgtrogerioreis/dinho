const { ValidationError } = require('../errors/validationError');
const { VALUATION_STATUS } = require('./valuationStatus');

function ensurePositiveFiniteNumber(value, fieldName) {
  if (!Number.isFinite(value)) {
    throw new ValidationError(`${fieldName} must be a finite number.`);
  }

  if (value <= 0) {
    throw new ValidationError(`${fieldName} must be greater than zero.`);
  }
}

function calculateMarginOfSafety(currentPrice, fairValue) {
  ensurePositiveFiniteNumber(currentPrice, 'Current price');

  const marginOfSafety = ((fairValue - currentPrice) / currentPrice) * 100;

  if (!Number.isFinite(marginOfSafety)) {
    throw new ValidationError('Margin of safety must be a finite number.');
  }

  return marginOfSafety;
}

function resolveValuationStatus(currentPrice, fairValue, tolerancePercentage) {
  ensurePositiveFiniteNumber(currentPrice, 'Current price');
  ensurePositiveFiniteNumber(fairValue, 'Fair value');
  ensurePositiveFiniteNumber(tolerancePercentage, 'Valuation tolerance percentage');

  const toleranceRatio = tolerancePercentage / 100;
  const lowerBound = fairValue * (1 - toleranceRatio);
  const upperBound = fairValue * (1 + toleranceRatio);

  if (currentPrice < lowerBound) {
    return VALUATION_STATUS.UNDERVALUED;
  }

  if (currentPrice > upperBound) {
    return VALUATION_STATUS.OVERVALUED;
  }

  return VALUATION_STATUS.FAIRLY_VALUED;
}

module.exports = {
  calculateMarginOfSafety,
  ensurePositiveFiniteNumber,
  resolveValuationStatus,
};
