const test = require('node:test');
const assert = require('node:assert/strict');

const { DataSourceError } = require('../../src/errors/dataSourceError');
const { NotFoundError } = require('../../src/errors/notFoundError');
const { calculateGrahamValuationByTicker } = require('../../src/services');

test('calculateGrahamValuationByTicker normalizes the ticker and returns domain output', async () => {
  const calls = [];
  const provider = {
    async getCompanyByTicker(ticker) {
      calls.push(ticker);
      return {
        ticker: 'PETR4',
        price: 34.5,
        eps: 6.82,
        bookValuePerShare: 42.31,
      };
    },
  };

  const result = await calculateGrahamValuationByTicker(' petr4 ', provider);

  assert.deepEqual(calls, ['PETR4']);
  assert.equal(result.method, 'GRAHAM');
  assert.equal(result.ticker, 'PETR4');
});

test('calculateGrahamValuationByTicker propagates provider errors', async () => {
  const provider = {
    async getCompanyByTicker() {
      throw new DataSourceError('Provider failed.');
    },
  };

  await assert.rejects(() => calculateGrahamValuationByTicker('PETR4', provider), DataSourceError);
});

test('calculateGrahamValuationByTicker rejects unknown companies', async () => {
  const provider = {
    async getCompanyByTicker() {
      return null;
    },
  };

  await assert.rejects(() => calculateGrahamValuationByTicker('PETR4', provider), NotFoundError);
});
