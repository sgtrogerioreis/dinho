const { InvalidTickerError } = require('../errors/invalidTickerError');

const B3_TICKER_PATTERN = /^[A-Z]{4}\d{1,2}$/;

function normalizeTicker(ticker) {
  if (typeof ticker !== 'string' || ticker.trim() === '') {
    throw new InvalidTickerError('Ticker must be a non-empty string.');
  }

  const normalizedTicker = ticker.trim().toUpperCase();

  if (!B3_TICKER_PATTERN.test(normalizedTicker)) {
    throw new InvalidTickerError('Ticker must follow a format like PETR4.');
  }

  return normalizedTicker;
}

module.exports = {
  B3_TICKER_PATTERN,
  normalizeTicker,
};
