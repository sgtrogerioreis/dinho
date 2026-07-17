const test = require('node:test');
const assert = require('node:assert/strict');

const { ValidationError } = require('../../src/errors/validationError');
const { calculateGrahamValuation, VALUATION_STATUS, assumptions } = require('../../src/valuation');

function createCompany(overrides = {}) {
  return {
    ticker: 'PETR4',
    price: 34.5,
    eps: 6.82,
    bookValuePerShare: 42.31,
    ...overrides,
  };
}

test('calculateGrahamValuation returns the full valuation contract', () => {
  const result = calculateGrahamValuation(createCompany());

  assert.deepEqual(Object.keys(result), [
    'method',
    'ticker',
    'currentPrice',
    'fairValue',
    'marginOfSafety',
    'status',
    'inputs',
    'assumptions',
    'formula',
  ]);
  assert.equal(result.method, 'GRAHAM');
  assert.equal(result.ticker, 'PETR4');
  assert.equal(result.inputs.eps, 6.82);
  assert.equal(result.inputs.bookValuePerShare, 42.31);
  assert.equal(result.assumptions.grahamMultiplier, assumptions.graham.grahamMultiplier);
  assert.equal(
    result.assumptions.fairValueTolerancePercentage,
    assumptions.graham.fairValueTolerancePercentage,
  );
  assert.equal(result.formula, 'sqrt(grahamMultiplier * EPS * BVPS)');
  assert.ok(Object.isFrozen(result));
  assert.ok(Object.isFrozen(result.inputs));
  assert.ok(Object.isFrozen(result.assumptions));
});

test('calculateGrahamValuation calculates the correct fair value', () => {
  const result = calculateGrahamValuation(createCompany());

  assert.ok(Math.abs(result.fairValue - 80.5758617701356) < 1e-9);
});

test('calculateGrahamValuation calculates a positive margin of safety', () => {
  const result = calculateGrahamValuation(createCompany());

  assert.ok(Math.abs(result.marginOfSafety - 133.5532225221322) < 1e-9);
});

test('calculateGrahamValuation calculates a negative margin of safety', () => {
  const result = calculateGrahamValuation(
    createCompany({
      price: 90,
    }),
  );
  const expectedMarginOfSafety = ((80.5758617701356 - 90) / 90) * 100;

  assert.ok(Math.abs(result.marginOfSafety - expectedMarginOfSafety) < 1e-9);
});

test('calculateGrahamValuation returns UNDERVALUED when price is more than 5 percent below fair value', () => {
  const result = calculateGrahamValuation(createCompany());

  assert.equal(result.status, VALUATION_STATUS.UNDERVALUED);
});

test('calculateGrahamValuation returns FAIRLY_VALUED inside the tolerance band', () => {
  const result = calculateGrahamValuation(
    createCompany({
      price: 80,
    }),
  );

  assert.equal(result.status, VALUATION_STATUS.FAIRLY_VALUED);
});

test('calculateGrahamValuation returns OVERVALUED when price is more than 5 percent above fair value', () => {
  const result = calculateGrahamValuation(
    createCompany({
      price: 90,
    }),
  );

  assert.equal(result.status, VALUATION_STATUS.OVERVALUED);
});

test('calculateGrahamValuation does not mutate the original company object', () => {
  const company = createCompany();
  const snapshot = { ...company };

  calculateGrahamValuation(company);

  assert.deepEqual(company, snapshot);
});

test('calculateGrahamValuation rejects an absent company', () => {
  assert.throws(() => calculateGrahamValuation(), ValidationError);
});

test('calculateGrahamValuation rejects invalid current price values', () => {
  assert.throws(
    () =>
      calculateGrahamValuation(
        createCompany({
          price: 0,
        }),
      ),
    ValidationError,
  );

  assert.throws(
    () =>
      calculateGrahamValuation(
        createCompany({
          price: -1,
        }),
      ),
    ValidationError,
  );
});

test('calculateGrahamValuation rejects invalid EPS values', () => {
  assert.throws(
    () =>
      calculateGrahamValuation(
        createCompany({
          eps: 0,
        }),
      ),
    ValidationError,
  );

  assert.throws(
    () =>
      calculateGrahamValuation(
        createCompany({
          eps: -1,
        }),
      ),
    ValidationError,
  );
});

test('calculateGrahamValuation rejects invalid book value per share values', () => {
  assert.throws(
    () =>
      calculateGrahamValuation(
        createCompany({
          bookValuePerShare: 0,
        }),
      ),
    ValidationError,
  );

  assert.throws(
    () =>
      calculateGrahamValuation(
        createCompany({
          bookValuePerShare: -1,
        }),
      ),
    ValidationError,
  );
});

test('calculateGrahamValuation rejects non numeric and missing fields', () => {
  assert.throws(
    () =>
      calculateGrahamValuation(
        createCompany({
          price: Number.NaN,
        }),
      ),
    ValidationError,
  );

  assert.throws(
    () =>
      calculateGrahamValuation({
        ticker: 'PETR4',
        price: 34.5,
        eps: 6.82,
      }),
    ValidationError,
  );
});
