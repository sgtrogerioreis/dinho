require('dotenv').config();

const appConfig = require('../src/config/app');
const { MissingCredentialError } = require('../src/errors/missingCredentialError');
const { BrapiHttpClient } = require('../src/providers/brapi/httpClient');
const { serializeError } = require('../src/utils/errorDetails');

const SAMPLE_TICKERS = [
  'PETR4',
  'VALE3',
  'BBAS3',
  'ITUB4',
  'BBDC4',
  'WEGE3',
  'TAEE11',
  'BBSE3',
  'ABEV3',
  'SUZB3',
];

async function main() {
  const providerConfig = appConfig.companyProvider.api;

  if (!providerConfig.apiKey) {
    throw new MissingCredentialError('BRAPI_API_KEY is required to validate BRAPI coverage.');
  }

  const client = new BrapiHttpClient({
    baseUrl: providerConfig.baseUrl,
    apiKey: providerConfig.apiKey,
    timeoutMs: providerConfig.timeoutMs,
  });

  const results = [];

  for (const ticker of SAMPLE_TICKERS) {
    results.push(await inspectTicker(client, ticker));
  }

  console.log(JSON.stringify(results, null, 2));
}

async function inspectTicker(client, ticker) {
  const queriedAt = new Date().toISOString();

  try {
    const quote = await client.getQuote(ticker);
    const statistics = await client.getStatistics(ticker);

    return {
      ticker,
      queriedAt,
      currentPrice: readFiniteNumber(quote.data.regularMarketPrice),
      lpa: readFiniteNumber(statistics.data.earningsPerShare),
      vpa: readFiniteNumber(statistics.data.bookValue),
      hasCurrentPrice: Number.isFinite(quote.data.regularMarketPrice),
      hasLpa: Number.isFinite(statistics.data.earningsPerShare),
      hasVpa: Number.isFinite(statistics.data.bookValue),
      status:
        Number.isFinite(quote.data.regularMarketPrice) &&
        Number.isFinite(statistics.data.earningsPerShare) &&
        Number.isFinite(statistics.data.bookValue)
          ? 'success'
          : 'partial-data',
      errorType: null,
    };
  } catch (error) {
    const details = serializeError(error);

    return {
      ticker,
      queriedAt,
      currentPrice: null,
      lpa: null,
      vpa: null,
      hasCurrentPrice: false,
      hasLpa: false,
      hasVpa: false,
      status: 'failed',
      errorType: details.name,
      errorCode: details.code,
      errorMessage: details.message,
    };
  }
}

function readFiniteNumber(value) {
  return Number.isFinite(value) ? value : null;
}

main().catch((error) => {
  console.error(JSON.stringify(serializeError(error), null, 2));
  process.exitCode = 1;
});
