const { FundamentalDataUnavailableError } = require('../../errors/fundamentalDataUnavailableError');
const { TtlCache } = require('../../cache/ttlCache');
const { BolsaiHttpClient } = require('./httpClient');

const BOLSAI_PROVIDER_NAME = 'BolsAI';

class BolsaiGrahamProvider {
  constructor(options = {}) {
    this.client =
      options.client ||
      new BolsaiHttpClient({
        apiKey: options.apiKey,
        baseUrl: options.baseUrl,
        timeoutMs: options.timeoutMs,
      });
    this.cache =
      options.cache ||
      new TtlCache({
        ttlMs: options.cacheTtlMs || 5 * 60 * 1000,
        maxEntries: options.cacheMaxEntries || 128,
      });
  }

  async getGrahamInputsByTicker(ticker) {
    const cacheKey = `graham:${ticker}`;
    const cached = this.cache.get(cacheKey);

    if (cached) {
      return cached;
    }

    const startedAt = Date.now();
    const fundamentals = await this.client.getFundamentals(ticker);
    const apiDurationMs = Date.now() - startedAt;
    const inputs = mapFundamentalsToGrahamInputs(fundamentals, ticker, {
      apiDurationMs,
    });

    this.cache.set(cacheKey, inputs);
    return inputs;
  }
}

function mapFundamentalsToGrahamInputs(fundamentals, ticker, metadata = {}) {
  const currentPrice = Number(fundamentals.close_price);
  const eps = Number(fundamentals.lpa);
  const bookValuePerShare = Number(fundamentals.vpa);

  if (!Number.isFinite(currentPrice) || currentPrice <= 0) {
    throw new FundamentalDataUnavailableError(
      `BolsAI current price is unavailable for "${ticker}".`,
    );
  }

  if (!Number.isFinite(eps)) {
    throw new FundamentalDataUnavailableError(`BolsAI LPA is unavailable for "${ticker}".`);
  }

  if (!Number.isFinite(bookValuePerShare)) {
    throw new FundamentalDataUnavailableError(`BolsAI VPA is unavailable for "${ticker}".`);
  }

  if (!fundamentals.reference_date) {
    throw new FundamentalDataUnavailableError(
      `BolsAI reference date is unavailable for "${ticker}".`,
    );
  }

  return {
    ticker,
    companyName: fundamentals.corporate_name || fundamentals.company_name || null,
    currentPrice,
    eps,
    bookValuePerShare,
    referenceDate: fundamentals.reference_date,
    provider: BOLSAI_PROVIDER_NAME,
    rawInputs: {
      netIncome: fundamentals.net_income ?? null,
      equity: fundamentals.equity ?? null,
      sharesOutstanding: fundamentals.shares_outstanding ?? null,
    },
    metadata,
  };
}

module.exports = {
  BOLSAI_PROVIDER_NAME,
  BolsaiGrahamProvider,
  mapFundamentalsToGrahamInputs,
};
