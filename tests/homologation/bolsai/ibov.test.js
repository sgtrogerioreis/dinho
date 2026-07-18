const test = require('node:test');
const assert = require('node:assert/strict');

const { buildB3PortfolioUrl, fetchIbovFromB3 } = require('../../../src/homologation/bolsai/ibov');

test('buildB3PortfolioUrl encodes the IBOV portfolio request', () => {
  const url = buildB3PortfolioUrl();

  assert.match(url, /GetPortfolioDay/);
  assert.match(url, /ey/);
});

test('fetchIbovFromB3 normalizes B3 portfolio rows', async () => {
  const result = await fetchIbovFromB3({
    async get() {
      return {
        data: {
          header: { date: '2026-07-15' },
          results: [{ cod: 'PETR4' }, { cod: 'vale3' }],
        },
      };
    },
  });

  assert.equal(result.source, 'B3');
  assert.equal(result.referenceDate, '2026-07-15');
  assert.deepEqual(result.tickers, ['PETR4', 'VALE3']);
});
