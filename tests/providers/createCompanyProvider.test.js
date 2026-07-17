const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { ConfigurationError } = require('../../src/errors/configurationError');
const { LocalCompanyProvider } = require('../../src/providers/localProvider');
const { createCompanyProvider } = require('../../src/providers/createCompanyProvider');

test('createCompanyProvider returns the local provider for the local driver', () => {
  const provider = createCompanyProvider({
    driver: 'local',
    filePath: path.resolve(__dirname, '../../data/companies.json'),
  });

  assert.ok(provider instanceof LocalCompanyProvider);
});

test('createCompanyProvider rejects unsupported drivers', () => {
  assert.throws(
    () =>
      createCompanyProvider({
        driver: 'api',
      }),
    ConfigurationError,
  );
});
