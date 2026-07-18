const test = require('node:test');
const assert = require('node:assert/strict');

const { AccessDeniedError } = require('../../../src/errors/accessDeniedError');
const { DataSourceError } = require('../../../src/errors/dataSourceError');
const { InvalidCredentialError } = require('../../../src/errors/invalidCredentialError');
const { MissingCredentialError } = require('../../../src/errors/missingCredentialError');
const { RateLimitError } = require('../../../src/errors/rateLimitError');
const { TemporaryDataSourceError } = require('../../../src/errors/temporaryDataSourceError');
const {
  BolsaiHttpClient,
  buildAuthHeaders,
  createHttpClientConfig,
  mapBolsaiHttpError,
  readRateLimitRemaining,
} = require('../../../src/homologation/bolsai/httpClient');

test('BolsaiHttpClient sends the API key through X-API-Key', () => {
  const config = createHttpClientConfig({
    apiKey: 'secret-token',
    baseUrl: 'https://api.usebolsai.com/api/v1',
  });

  assert.deepEqual(config.headers, {
    'X-API-Key': 'secret-token',
  });
});

test('BolsaiHttpClient requires BOLSAI_API_KEY for HTTP config', () => {
  assert.throws(() => buildAuthHeaders(null), MissingCredentialError);
});

test('BolsaiHttpClient returns payload and rate limit header', async () => {
  const client = new BolsaiHttpClient({
    apiKey: 'test-key',
    httpClient: {
      async get(path, options) {
        assert.equal(path, '/stocks/PETR4/quote');
        assert.deepEqual(options.params, {});
        return {
          data: { ticker: 'PETR4', close: 30 },
          headers: { 'x-ratelimit-remaining': '199' },
        };
      },
    },
  });

  const result = await client.request('/stocks/PETR4/quote', { ticker: 'PETR4' });

  assert.equal(result.data.ticker, 'PETR4');
  assert.equal(result.rateLimitRemaining, 199);
});

test('BolsaiHttpClient maps invalid responses', async () => {
  const client = new BolsaiHttpClient({
    apiKey: 'test-key',
    httpClient: {
      async get() {
        return { data: null };
      },
    },
  });

  await assert.rejects(() => client.request('/bad'), DataSourceError);
});

test('BolsaiHttpClient maps invalid key errors without leaking key', () => {
  const mapped = mapBolsaiHttpError(
    {
      response: { status: 401 },
    },
    'PETR4',
  );

  assert.ok(mapped instanceof InvalidCredentialError);
  assert.equal(mapped.message.includes('test-key'), false);
});

test('BolsaiHttpClient maps rate limit, access denied, timeout and server errors', () => {
  assert.ok(
    mapBolsaiHttpError({ response: { status: 403 } }, 'PETR4') instanceof AccessDeniedError,
  );
  assert.ok(mapBolsaiHttpError({ response: { status: 429 } }, 'PETR4') instanceof RateLimitError);
  assert.ok(
    mapBolsaiHttpError({ code: 'ECONNABORTED' }, 'PETR4') instanceof TemporaryDataSourceError,
  );
  assert.ok(
    mapBolsaiHttpError({ response: { status: 503 } }, 'PETR4') instanceof TemporaryDataSourceError,
  );
  assert.ok(mapBolsaiHttpError({ response: { status: 400 } }, 'PETR4') instanceof DataSourceError);
});

test('readRateLimitRemaining accepts case-insensitive headers and ignores invalid values', () => {
  assert.equal(readRateLimitRemaining({ 'X-RateLimit-Remaining': '12' }), 12);
  assert.equal(readRateLimitRemaining({ 'X-RateLimit-Remaining': 'abc' }), null);
  assert.equal(readRateLimitRemaining({}), null);
});
