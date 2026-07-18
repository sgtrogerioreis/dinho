const test = require('node:test');
const assert = require('node:assert/strict');

const { ANALYSIS_STATUS } = require('../../src/analysis/analysisStatus');
const { calculateGrahamAnalysis } = require('../../src/analysis/methods/graham');
const { analyzeGrahamByTicker } = require('../../src/services/analyzeGraham');

test('calculateGrahamAnalysis calculates PETR4 with the homologated formula', () => {
  const result = calculateGrahamAnalysis({
    ticker: 'PETR4',
    companyName: 'PETROBRAS',
    currentPrice: 30,
    eps: 8.35,
    bookValuePerShare: 34.54,
    referenceDate: '2026-07-17',
    provider: 'BolsAI',
  });

  assert.equal(result.status, ANALYSIS_STATUS.UNDERVALUED);
  assert.equal(Number(result.fairPrice.toFixed(2)), 80.56);
  assert.equal(Number(result.marginOfSafety.toFixed(2)), 62.76);
});

test('calculateGrahamAnalysis calculates VALE3 and WEGE3 without changing the formula', () => {
  const vale = calculateGrahamAnalysis({
    ticker: 'VALE3',
    currentPrice: 55,
    eps: 3.51,
    bookValuePerShare: 43.07,
    referenceDate: '2026-07-17',
    provider: 'BolsAI',
  });
  const wege = calculateGrahamAnalysis({
    ticker: 'WEGE3',
    currentPrice: 40,
    eps: 1.5,
    bookValuePerShare: 4.23,
    referenceDate: '2026-07-17',
    provider: 'BolsAI',
  });

  assert.equal(Number(vale.fairPrice.toFixed(2)), 58.32);
  assert.equal(Number(wege.fairPrice.toFixed(2)), 11.95);
  assert.equal(wege.status, ANALYSIS_STATUS.OVERVALUED);
});

test('calculateGrahamAnalysis returns NOT_APPLICABLE for non-positive LPA or VPA', () => {
  const result = calculateGrahamAnalysis({
    ticker: 'CSAN3',
    currentPrice: 10,
    eps: -1,
    bookValuePerShare: 5,
    referenceDate: '2026-07-17',
    provider: 'BolsAI',
  });

  assert.equal(result.status, ANALYSIS_STATUS.NOT_APPLICABLE);
  assert.equal(result.fairPrice, null);
  assert.equal(result.marginOfSafety, null);
  assert.equal(result.warnings.length, 1);
});

test('analyzeGrahamByTicker normalizes tickers before calling the provider', async () => {
  const result = await analyzeGrahamByTicker(' petr4f ', {
    async getGrahamInputsByTicker(ticker) {
      assert.equal(ticker, 'PETR4F');
      return {
        ticker,
        currentPrice: 30,
        eps: 8.35,
        bookValuePerShare: 34.54,
        referenceDate: '2026-07-17',
        provider: 'BolsAI',
      };
    },
  });

  assert.equal(result.ticker, 'PETR4F');
});
