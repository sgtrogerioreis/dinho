const test = require('node:test');
const assert = require('node:assert/strict');

const { InvalidCredentialError } = require('../../../src/errors/invalidCredentialError');
const { MissingCredentialError } = require('../../../src/errors/missingCredentialError');
const { NotFoundError } = require('../../../src/errors/notFoundError');
const { RateLimitError } = require('../../../src/errors/rateLimitError');
const { TemporaryDataSourceError } = require('../../../src/errors/temporaryDataSourceError');
const {
  BolsaiHttpClient,
  buildAuthHeaders,
  createHttpClientConfig,
} = require('../../../src/providers/bolsai/httpClient');

test('production BolsAI client sends X-API-Key and only calls fundamentals', async () => {
  const client = new BolsaiHttpClient({
    httpClient: {
      async get(path) {
        assert.equal(path, '/fundamentals/PETR4');
        return { data: { ticker: 'PETR4' } };
      },
    },
  });

  const result = await client.getFundamentals('PETR4');

  assert.equal(result.ticker, 'PETR4');
  assert.deepEqual(buildAuthHeaders('token'), { 'X-API-Key': 'token' });
  assert.equal(createHttpClientConfig({ apiKey: 'token' }).headers['X-API-Key'], 'token');
});

test('production BolsAI client maps auth, not found, timeout and rate limit errors', async () => {
  assert.throws(() => buildAuthHeaders(null), MissingCredentialError);
  await assert.rejects(() => failingClient(401).getFundamentals('PETR4'), InvalidCredentialError);
  await assert.rejects(() => failingClient(404).getFundamentals('XXXX3'), NotFoundError);
  await assert.rejects(() => failingClient(429).getFundamentals('PETR4'), RateLimitError);
  await assert.rejects(
    () =>
      new BolsaiHttpClient({
        httpClient: {
          async get() {
            const error = new Error('timeout');
            error.code = 'ECONNABORTED';
            throw error;
          },
        },
      }).getFundamentals('PETR4'),
    TemporaryDataSourceError,
  );
});

function failingClient(status) {
  return new BolsaiHttpClient({
    httpClient: {
      async get() {
        const error = new Error('failed');
        error.response = { status };
        throw error;
      },
    },
  });
}
