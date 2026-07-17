const test = require('node:test');
const assert = require('node:assert/strict');

const { DataSourceError } = require('../../src/errors/dataSourceError');
const {
  FundamentalDataUnavailableError,
} = require('../../src/errors/fundamentalDataUnavailableError');
const { MissingCredentialError } = require('../../src/errors/missingCredentialError');
const { NotFoundError } = require('../../src/errors/notFoundError');
const { ApiCompanyProvider } = require('../../src/providers/apiProvider');

test('ApiCompanyProvider maps a valid BRAPI quote and statistics pair to Company', async () => {
  const provider = new ApiCompanyProvider({
    baseUrl: 'https://brapi.dev/api/v2',
    brapiClient: {
      async getQuote() {
        return {
          symbol: 'PETR4',
          data: {
            longName: 'Petroleo Brasileiro SA Pfd',
            regularMarketPrice: 39.89,
          },
        };
      },
      async getStatistics() {
        return {
          symbol: 'PETR4',
          data: {
            earningsPerShare: 8.347058,
            bookValue: 34.540943,
            sharesOutstanding: 12888733000,
          },
        };
      },
    },
  });

  const company = await provider.getCompanyByTicker('PETR4');

  assert.equal(company.ticker, 'PETR4');
  assert.equal(company.price, 39.89);
  assert.equal(company.eps, 8.347058);
  assert.equal(company.bookValuePerShare, 34.540943);
});

test('ApiCompanyProvider requires a credential when no BRAPI client is injected', () => {
  assert.throws(
    () =>
      new ApiCompanyProvider({
        baseUrl: 'https://brapi.dev/api/v2',
      }),
    MissingCredentialError,
  );
});

test('ApiCompanyProvider propagates ticker not found errors', async () => {
  const provider = new ApiCompanyProvider({
    baseUrl: 'https://brapi.dev/api/v2',
    brapiClient: {
      async getQuote() {
        throw new NotFoundError('Ticker not found.');
      },
      async getStatistics() {
        throw new Error('should not be called');
      },
    },
  });

  await assert.rejects(() => provider.getCompanyByTicker('XXXX3'), NotFoundError);
});

test('ApiCompanyProvider propagates HTTP and API data source errors', async () => {
  const provider = new ApiCompanyProvider({
    baseUrl: 'https://brapi.dev/api/v2',
    brapiClient: {
      async getQuote() {
        throw new DataSourceError('HTTP error.');
      },
      async getStatistics() {
        throw new Error('should not be called');
      },
    },
  });

  await assert.rejects(() => provider.getCompanyByTicker('PETR4'), DataSourceError);
});

test('ApiCompanyProvider maps partial statistics as unavailable Graham fundamentals', async () => {
  const provider = new ApiCompanyProvider({
    baseUrl: 'https://brapi.dev/api/v2',
    brapiClient: {
      async getQuote() {
        return {
          symbol: 'PETR4',
          data: {
            longName: 'Petroleo Brasileiro SA Pfd',
            regularMarketPrice: 39.89,
          },
        };
      },
      async getStatistics() {
        return {
          symbol: 'PETR4',
          data: {
            earningsPerShare: 8.347058,
          },
        };
      },
    },
  });

  await assert.rejects(() => provider.getCompanyByTicker('PETR4'), FundamentalDataUnavailableError);
});
