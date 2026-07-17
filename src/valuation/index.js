const assumptions = require('./assumptions');
const { calculateGrahamValuation } = require('./methods/graham');
const { VALUATION_STATUS } = require('./valuationStatus');

module.exports = {
  assumptions,
  calculateGrahamValuation,
  VALUATION_STATUS,
};
