const test = require('node:test');
const assert = require('node:assert/strict');

const { ValidationError } = require('../../src/errors/validationError');
const { Company } = require('../../src/models/company');

test('Company.fromRaw normalizes valid company data', () => {
  const company = Company.fromRaw({
    ticker: ' petr4 ',
    name: ' Petrobras ',
    price: 34.5,
    eps: 6.82,
    bookValuePerShare: 42.31,
    annualDividend: 3.42,
    fcf: 110000000000,
    sharesOutstanding: 13044000000,
    netDebt: 210000000000,
  });

  assert.equal(company.ticker, 'PETR4');
  assert.equal(company.name, 'Petrobras');
  assert.equal(company.bookValuePerShare, 42.31);
});

test('Company.fromRaw throws a domain validation error for invalid input', () => {
  assert.throws(
    () =>
      Company.fromRaw({
        ticker: 'PETR4',
      }),
    ValidationError,
  );
});
