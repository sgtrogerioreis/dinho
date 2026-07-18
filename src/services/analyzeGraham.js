const { FundamentalDataUnavailableError } = require('../errors/fundamentalDataUnavailableError');
const { normalizeTicker } = require('../utils/ticker');
const { calculateGrahamAnalysis } = require('../analysis/methods/graham');

async function analyzeGrahamByTicker(ticker, provider) {
  if (!provider || typeof provider.getGrahamInputsByTicker !== 'function') {
    throw new FundamentalDataUnavailableError('A Graham input provider is required.');
  }

  const normalizedTicker = normalizeTicker(ticker);
  const inputs = await provider.getGrahamInputsByTicker(normalizedTicker);

  if (!inputs) {
    throw new FundamentalDataUnavailableError(`Graham inputs not found for "${normalizedTicker}".`);
  }

  return calculateGrahamAnalysis(inputs);
}

module.exports = {
  analyzeGrahamByTicker,
};
