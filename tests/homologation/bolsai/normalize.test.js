const test = require('node:test');
const assert = require('node:assert/strict');

const {
  countDistinctPeriods,
  countDistinctYears,
  normalizeTickerAudit,
} = require('../../../src/homologation/bolsai/normalize');

test('normalizeTickerAudit marks Graham complete and calculates check value', () => {
  const result = normalizeTickerAudit('PETR4', {
    company: { trade_name: 'PETROBRAS', sector: 'Petroleo' },
    quote: { close: 30, trade_date: '2026-07-17' },
    fundamentals: {
      lpa: 5,
      vpa: 20,
      net_income: 500,
      equity: 2000,
      shares_outstanding: 100,
    },
  });

  assert.equal(result.methods.graham.status, 'completo');
  assert.equal(result.methods.graham.fields.currentPrice, 'available');
  assert.equal(Number(result.methods.graham.checkValue.toFixed(2)), 47.43);
});

test('normalizeTickerAudit records access denied for PRO dividend and financial endpoints', () => {
  const result = normalizeTickerAudit(
    'WEGE3',
    {
      quote: { close: 40, trade_date: '2026-07-17' },
      fundamentals: { lpa: 2, vpa: 10, shares_outstanding: 10 },
    },
    {
      dividends: { category: 'access_denied' },
      financialsAnnual: { category: 'access_denied' },
      financialsQuarterly: { category: 'access_denied' },
    },
  );

  assert.equal(result.methods.bazin.status, 'indisponivel');
  assert.equal(result.methods.fcd.status, 'indisponivel');
  assert.equal(result.methods.bazin.fields.dividendsEndpoint, 'access_denied');
});

test('normalizeTickerAudit classifies Bazin fields and complete years', () => {
  const result = normalizeTickerAudit('BBAS3', {
    quote: { close: 20, trade_date: '2026-07-17' },
    fundamentals: { lpa: 4, vpa: 12, shares_outstanding: 10 },
    dividends: {
      current_price: 20,
      dividend_yield_ttm: 10,
      ttm_per_share: 2,
      annual_summary: [
        { year: 2025, total_per_share: 2, payments: 4 },
        { year: 2024, total_per_share: 0, payments: 0 },
      ],
      payments: [
        { ex_date: '2025-03-01', payment_date: '2025-04-01', type: 'JCP', value_per_share: 1 },
      ],
    },
  });

  assert.equal(result.methods.bazin.status, 'completo');
  assert.equal(result.methods.bazin.completeYears, 1);
});

test('normalizeTickerAudit detects annual and quarterly financial series coverage', () => {
  const statements = [2021, 2022, 2023, 2024, 2025].flatMap((year) => [
    {
      reference_date: `${year}-12-31`,
      statement_type: 'DRE',
      account_name: 'Receita Liquida',
      value: 10,
    },
    {
      reference_date: `${year}-12-31`,
      statement_type: 'DRE',
      account_name: 'Resultado Antes do Resultado Financeiro',
      value: 4,
    },
    {
      reference_date: `${year}-12-31`,
      statement_type: 'DFC_MI',
      account_name: 'Caixa Liquido Atividades Operacionais',
      value: 3,
    },
    {
      reference_date: `${year}-12-31`,
      statement_type: 'DFC_MI',
      account_name: 'Aquisicao de Imobilizado',
      value: -1,
    },
    {
      reference_date: `${year}-12-31`,
      statement_type: 'BPA',
      account_name: 'Caixa e Equivalentes de Caixa',
      value: 8,
    },
  ]);

  const result = normalizeTickerAudit('VALE3', {
    fundamentals: { total_debt: 4, shares_outstanding: 10 },
    financialsAnnual: { statements },
    financialsQuarterly: {
      statements: [{ reference_date: '2026-03-31', account_name: 'Receita Liquida' }],
    },
  });

  assert.equal(result.methods.fcd.status, 'parcial');
  assert.equal(result.methods.fcd.annualYears, 5);
  assert.equal(result.methods.fcd.quarterlyPeriods, 1);
  assert.equal(result.methods.fcd.fields.scaleAndCurrency, 'missing');
});

test('count helpers ignore duplicate periods', () => {
  const statements = [
    { reference_date: '2025-12-31' },
    { reference_date: '2025-12-31' },
    { reference_date: '2024-12-31' },
  ];

  assert.equal(countDistinctYears(statements), 2);
  assert.equal(countDistinctPeriods(statements), 2);
});
