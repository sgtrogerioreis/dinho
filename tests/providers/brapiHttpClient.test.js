const test = require('node:test');
const assert = require('node:assert/strict');

const { AccessDeniedError } = require('../../src/errors/accessDeniedError');
const { DataSourceError } = require('../../src/errors/dataSourceError');
const { InvalidCredentialError } = require('../../src/errors/invalidCredentialError');
const { MissingCredentialError } = require('../../src/errors/missingCredentialError');
const { NotFoundError } = require('../../src/errors/notFoundError');
const { RateLimitError } = require('../../src/errors/rateLimitError');
const { TemporaryDataSourceError } = require('../../src/errors/temporaryDataSourceError');
const { BrapiHttpClient, createHttpClientConfig } = require('../../src/providers/brapi/httpClient');

test('BrapiHttpClient accepts a valid response', async () => {
  const client = new BrapiHttpClient({
    baseUrl: 'https://brapi.dev/api/v2',
    apiKey: 'test-key',
    httpClient: {
      async get() {
        return {
          data: {
            results: [
              {
                symbol: 'PETR4',
                data: {
                  regularMarketPrice: 39.89,
                },
              },
            ],
          },
        };
      },
    },
  });

  const result = await client.getQuote('PETR4');

  assert.equal(result.symbol, 'PETR4');
  assert.equal(result.data.regularMarketPrice, 39.89);
});

test('BrapiHttpClient requires an API key when creating HTTP config', () => {
  assert.throws(
    () =>
      createHttpClientConfig({
        baseUrl: 'https://brapi.dev/api/v2',
        apiKey: null,
        timeoutMs: 10000,
      }),
    MissingCredentialError,
  );
});

test('BrapiHttpClient sends the token through Authorization Bearer', () => {
  const config = createHttpClientConfig({
    baseUrl: 'https://brapi.dev/api/v2',
    apiKey: 'secret-token',
    timeoutMs: 10000,
  });

  assert.deepEqual(config.headers, {
    Authorization: 'Bearer secret-token',
  });
});

test('BrapiHttpClient maps missing results to not found', async () => {
  const client = new BrapiHttpClient({
    baseUrl: 'https://brapi.dev/api/v2',
    apiKey: 'test-key',
    httpClient: {
      async get() {
        return {
          data: {
            results: [],
          },
        };
      },
    },
  });

  await assert.rejects(() => client.getQuote('XXXX3'), NotFoundError);
});

test('BrapiHttpClient maps invalid token errors', async () => {
  const client = new BrapiHttpClient({
    baseUrl: 'https://brapi.dev/api/v2',
    apiKey: 'test-key',
    httpClient: {
      async get() {
        const error = new Error('unauthorized');
        error.response = {
          status: 401,
          data: {
            error: true,
            code: 'UNAUTHORIZED',
          },
        };
        throw error;
      },
    },
  });

  let capturedError = null;

  try {
    await client.getQuote('BBAS3');
  } catch (error) {
    capturedError = error;
  }

  assert.ok(capturedError instanceof InvalidCredentialError);
  assert.equal(capturedError.message.includes('test-key'), false);
});

test('BrapiHttpClient maps plan access errors', async () => {
  const client = new BrapiHttpClient({
    baseUrl: 'https://brapi.dev/api/v2',
    apiKey: 'test-key',
    httpClient: {
      async get() {
        const error = new Error('forbidden');
        error.response = {
          status: 403,
          data: {
            error: true,
            code: 'FORBIDDEN',
          },
        };
        throw error;
      },
    },
  });

  await assert.rejects(() => client.getQuote('WEGE3'), AccessDeniedError);
});

test('BrapiHttpClient maps rate limit errors', async () => {
  const client = new BrapiHttpClient({
    baseUrl: 'https://brapi.dev/api/v2',
    apiKey: 'test-key',
    httpClient: {
      async get() {
        const error = new Error('rate limited');
        error.response = {
          status: 429,
          data: {
            error: true,
            code: 'RATE_LIMIT_EXCEEDED',
          },
        };
        throw error;
      },
    },
  });

  await assert.rejects(() => client.getQuote('PETR4'), RateLimitError);
});

test('BrapiHttpClient maps timeouts as temporary API failures', async () => {
  const client = new BrapiHttpClient({
    baseUrl: 'https://brapi.dev/api/v2',
    apiKey: 'test-key',
    httpClient: {
      async get() {
        const error = new Error('timeout');
        error.code = 'ECONNABORTED';
        throw error;
      },
    },
  });

  await assert.rejects(() => client.getQuote('PETR4'), TemporaryDataSourceError);
});

test('BrapiHttpClient maps invalid responses', async () => {
  const client = new BrapiHttpClient({
    baseUrl: 'https://brapi.dev/api/v2',
    apiKey: 'test-key',
    httpClient: {
      async get() {
        return {
          data: null,
        };
      },
    },
  });

  await assert.rejects(() => client.getQuote('PETR4'), DataSourceError);
});
