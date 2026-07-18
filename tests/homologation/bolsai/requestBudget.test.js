const test = require('node:test');
const assert = require('node:assert/strict');

const {
  RequestBudget,
  estimateRequests,
} = require('../../../src/homologation/bolsai/requestBudget');

test('RequestBudget stops before configured safety margin', () => {
  const budget = new RequestBudget({ limit: 10, safetyMargin: 2, completed: 7 });

  assert.equal(budget.canConsume(1), true);
  assert.equal(budget.canConsume(2), false);
  assert.equal(budget.consume(1), 8);
  assert.throws(() => budget.consume(1), /stopped/);
});

test('RequestBudget reports safe remaining requests', () => {
  const budget = new RequestBudget({ limit: 200, safetyMargin: 5, completed: 190 });

  assert.equal(budget.remainingSafe(), 5);
});

test('estimateRequests subtracts completed cached payloads', () => {
  assert.equal(estimateRequests(3, 7, 4), 17);
  assert.equal(estimateRequests(1, 2, 5), 0);
});
