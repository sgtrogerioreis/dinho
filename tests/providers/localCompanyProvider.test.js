const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { ConfigurationError } = require('../../src/errors/configurationError');
const { LocalCompanyProvider } = require('../../src/providers/localProvider');

test('LocalCompanyProvider returns a company when the ticker exists', async () => {
  const provider = new LocalCompanyProvider({
    filePath: path.resolve(__dirname, '../../data/companies.json'),
  });

  const company = await provider.getCompanyByTicker('vale3');

  assert.ok(company);
  assert.equal(company.ticker, 'VALE3');
});

test('LocalCompanyProvider requires a file path', () => {
  assert.throws(() => new LocalCompanyProvider(), ConfigurationError);
});
