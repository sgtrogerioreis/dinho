const test = require('node:test');
const assert = require('node:assert/strict');

const { AccessDeniedError } = require('../../../src/errors/accessDeniedError');
const {
  auditTicker,
  buildUniverse,
  runAudit,
  sanitizeError,
} = require('../../../src/homologation/bolsai/auditRunner');
const { ENDPOINTS } = require('../../../src/homologation/bolsai/endpoints');

test('buildUniverse removes duplicates but keeps different share classes', () => {
  const universe = buildUniverse({
    requiredTickers: ['PETR4', 'VALE3', 'PETR4'],
    ibovTickers: ['PETR3', 'PETR4'],
  });

  assert.deepEqual(universe.total, ['PETR4', 'VALE3', 'PETR3']);
});

test('runAudit dry-run estimates requests without API key or real calls', async () => {
  const result = await runAudit({
    dryRun: true,
    requiredOnly: true,
    requiredTickersPath: 'data/bolsai-homologation-tickers.json',
    storage: memoryStorage(),
  });

  assert.equal(result.dryRun, true);
  assert.equal(result.estimate.tickers, 11);
  assert.equal(result.estimate.endpointsPerTicker, ENDPOINTS.length);
  assert.equal(result.estimate.estimatedRequests, 77);
});

test('auditTicker resumes cached payloads without repeating requests', async () => {
  const storage = memoryStorage({
    'PETR4:quote': { ticker: 'PETR4', close: 30 },
  });
  let calls = 0;

  const result = await auditTicker({
    ticker: 'PETR4',
    endpoints: [
      { key: 'quote', path: '/stocks/{ticker}/quote' },
      { key: 'company', path: '/companies/{ticker}' },
    ],
    storage,
    resume: true,
    delayMs: 0,
    budget: {
      canConsume: () => true,
      consume: () => undefined,
    },
    client: {
      async requestEndpoint(endpoint) {
        calls += 1;
        return { data: { endpoint: endpoint.key } };
      },
    },
  });

  assert.equal(calls, 1);
  assert.equal(result.requestCount, 1);
  assert.equal(result.payloads.quote.close, 30);
});

test('auditTicker sanitizes access denied errors and continues', async () => {
  const result = await auditTicker({
    ticker: 'PETR4',
    endpoints: [
      { key: 'dividends', path: '/dividends/{ticker}' },
      { key: 'quote', path: '/stocks/{ticker}/quote' },
    ],
    storage: memoryStorage(),
    resume: false,
    delayMs: 0,
    budget: {
      canConsume: () => true,
      consume: () => undefined,
    },
    client: {
      async requestEndpoint(endpoint) {
        if (endpoint.key === 'dividends') {
          throw new AccessDeniedError('forbidden');
        }
        return { data: { close: 10 } };
      },
    },
  });

  assert.equal(result.errors.dividends.category, 'access_denied');
  assert.equal(result.payloads.quote.close, 10);
});

test('sanitizeError does not include secret-bearing messages', () => {
  const error = new Error('bad key redacted-secret');
  error.code = 'INVALID_CREDENTIAL_ERROR';

  assert.deepEqual(sanitizeError(error), {
    category: 'invalid_credential',
    code: 'INVALID_CREDENTIAL_ERROR',
  });
});

function memoryStorage(initial = {}) {
  const payloads = new Map(Object.entries(initial));

  return {
    async ensure() {},
    async hasPayload(ticker, key) {
      return payloads.has(`${ticker}:${key}`);
    },
    async readPayload(ticker, key) {
      return payloads.get(`${ticker}:${key}`);
    },
    async writePayload(ticker, key, payload) {
      payloads.set(`${ticker}:${key}`, payload);
    },
    async hasError(ticker, key) {
      return payloads.has(`error:${ticker}:${key}`);
    },
    async readError(ticker, key) {
      return payloads.get(`error:${ticker}:${key}`);
    },
    async writeError(ticker, key, error) {
      payloads.set(`error:${ticker}:${key}`, error);
    },
  };
}
