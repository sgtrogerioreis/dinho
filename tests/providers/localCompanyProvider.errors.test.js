const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { DataSourceError } = require('../../src/errors/dataSourceError');
const { ValidationError } = require('../../src/errors/validationError');
const { LocalCompanyProvider } = require('../../src/providers/localProvider');

test('LocalCompanyProvider returns null for an unknown ticker', async () => {
  const provider = new LocalCompanyProvider({
    filePath: path.resolve(__dirname, '../../data/companies.json'),
  });

  const company = await provider.getCompanyByTicker('ABCD99');

  assert.equal(company, null);
});

test('LocalCompanyProvider trims spaces around the ticker', async () => {
  const provider = new LocalCompanyProvider({
    filePath: path.resolve(__dirname, '../../data/companies.json'),
  });

  const company = await provider.getCompanyByTicker('  petr4  ');

  assert.ok(company);
  assert.equal(company.ticker, 'PETR4');
});

test('LocalCompanyProvider throws a data source error for invalid JSON', async () => {
  const provider = new LocalCompanyProvider({
    filePath: path.resolve(__dirname, '../fixtures/invalid-companies.json'),
  });

  await assert.rejects(() => provider.getCompanyByTicker('PETR4'), DataSourceError);
});

test('LocalCompanyProvider throws a data source error for a missing file', async () => {
  const provider = new LocalCompanyProvider({
    filePath: path.resolve(__dirname, '../fixtures/file-does-not-exist.json'),
  });

  await assert.rejects(() => provider.getCompanyByTicker('PETR4'), DataSourceError);
});

test('LocalCompanyProvider throws a validation error when required company data is missing', async () => {
  const provider = new LocalCompanyProvider({
    filePath: path.resolve(__dirname, '../fixtures/companies.missing-fields.json'),
  });

  await assert.rejects(() => provider.getCompanyByTicker('PETR4'), ValidationError);
});
