const test = require('node:test');
const assert = require('node:assert/strict');

const { TtlCache } = require('../../src/cache/ttlCache');

test('TtlCache evicts oldest entries when maxEntries is reached', () => {
  const cache = new TtlCache({ maxEntries: 2 });

  cache.set('PETR4', { ticker: 'PETR4' });
  cache.set('VALE3', { ticker: 'VALE3' });
  cache.set('WEGE3', { ticker: 'WEGE3' });

  assert.equal(cache.get('PETR4'), null);
  assert.deepEqual(cache.get('VALE3'), { ticker: 'VALE3' });
  assert.deepEqual(cache.get('WEGE3'), { ticker: 'WEGE3' });
});

test('TtlCache removes expired entries before enforcing the limit', () => {
  let now = 1000;
  const cache = new TtlCache({
    ttlMs: 100,
    maxEntries: 2,
    clock: {
      now() {
        return now;
      },
    },
  });

  cache.set('expired', { ticker: 'OLD' });
  now = 1200;
  cache.set('PETR4', { ticker: 'PETR4' });
  cache.set('VALE3', { ticker: 'VALE3' });

  assert.equal(cache.get('expired'), null);
  assert.deepEqual(cache.get('PETR4'), { ticker: 'PETR4' });
  assert.deepEqual(cache.get('VALE3'), { ticker: 'VALE3' });
});
