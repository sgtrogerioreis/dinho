const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { ApiCompanyProvider } = require('../../src/providers/apiProvider');
const { ConfigurationError } = require('../../src/errors/configurationError');
const { LocalCompanyProvider } = require('../../src/providers/localProvider');
const { MissingCredentialError } = require('../../src/errors/missingCredentialError');
const { createCompanyProvider } = require('../../src/providers/createCompanyProvider');

test('createCompanyProvider returns the local provider without BRAPI credential', () => {
  const provider = createCompanyProvider({
    driver: 'local',
    local: {
      filePath: path.resolve(__dirname, '../../data/companies.json'),
    },
    api: {
      baseUrl: 'https://brapi.dev/api/v2',
      apiKey: null,
      timeoutMs: 10000,
    },
  });

  assert.ok(provider instanceof LocalCompanyProvider);
});

test('createCompanyProvider returns the api provider when the API credential exists', () => {
  const provider = createCompanyProvider({
    driver: 'api',
    local: {
      filePath: path.resolve(__dirname, '../../data/companies.json'),
    },
    api: {
      baseUrl: 'https://brapi.dev/api/v2',
      apiKey: 'test-key',
      timeoutMs: 10000,
    },
  });

  assert.ok(provider instanceof ApiCompanyProvider);
});

test('createCompanyProvider rejects api driver without credential', () => {
  assert.throws(
    () =>
      createCompanyProvider({
        driver: 'api',
        local: {
          filePath: path.resolve(__dirname, '../../data/companies.json'),
        },
        api: {
          baseUrl: 'https://brapi.dev/api/v2',
          apiKey: null,
          timeoutMs: 10000,
        },
      }),
    MissingCredentialError,
  );
});

test('createCompanyProvider rejects unsupported drivers', () => {
  assert.throws(
    () =>
      createCompanyProvider({
        driver: 'csv',
        local: {
          filePath: path.resolve(__dirname, '../../data/companies.json'),
        },
        api: {
          baseUrl: 'https://brapi.dev/api/v2',
          apiKey: 'test-key',
          timeoutMs: 10000,
        },
      }),
    ConfigurationError,
  );
});

test('createCompanyProvider rejects missing configuration', () => {
  assert.throws(() => createCompanyProvider(), ConfigurationError);
});
