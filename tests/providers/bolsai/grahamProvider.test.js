const test = require('node:test');
const assert = require('node:assert/strict');

const {
  FundamentalDataUnavailableError,
} = require('../../../src/errors/fundamentalDataUnavailableError');
const {
  BolsaiGrahamProvider,
  mapFundamentalsToGrahamInputs,
} = require('../../../src/providers/bolsai/grahamProvider');

test('BolsaiGrahamProvider maps fundamentals and caches results', async () => {
  let calls = 0;
  const provider = new BolsaiGrahamProvider({
    cache: memoryCache(),
    client: {
      async getFundamentals(ticker) {
        calls += 1;
        return {
          ticker,
          corporate_name: 'PETROBRAS',
          close_price: 30,
          reference_date: '2026-07-17',
          lpa: 8.35,
          vpa: 34.54,
          net_income: 100,
          equity: 200,
          shares_outstanding: 10,
        };
      },
    },
  });

  const first = await provider.getGrahamInputsByTicker('PETR4');
  const second = await provider.getGrahamInputsByTicker('PETR4');

  assert.equal(calls, 1);
  assert.equal(first, second);
  assert.equal(first.provider, 'BolsAI');
});

test('mapFundamentalsToGrahamInputs rejects missing required fields', () => {
  assert.throws(
    () =>
      mapFundamentalsToGrahamInputs(
        {
          close_price: null,
          reference_date: '2026-07-17',
          lpa: 1,
          vpa: 1,
        },
        'PETR4',
      ),
    FundamentalDataUnavailableError,
  );
});

function memoryCache() {
  const values = new Map();

  return {
    get(key) {
      return values.get(key) || null;
    },
    set(key, value) {
      values.set(key, value);
    },
  };
}
