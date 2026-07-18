const test = require('node:test');
const assert = require('node:assert/strict');

const { summarizeUniverse, toCsv } = require('../../../src/homologation/bolsai/report');

test('summarizeUniverse calculates method coverage by layer', () => {
  const results = [
    tickerResult('PETR4', 'completo', 'parcial', 'indisponivel'),
    tickerResult('VALE3', 'completo', 'completo', 'completo'),
  ];

  const summary = summarizeUniverse(results, {
    required: ['PETR4'],
    ibov: ['PETR4', 'VALE3'],
  });

  assert.equal(summary.required.grahamCoveragePct, 100);
  assert.equal(summary.required.bazinCoveragePct, 0);
  assert.equal(summary.ibov.fcdCoveragePct, 50);
  assert.equal(summary.total.allComplete, 1);
});

test('toCsv includes normalized fields and no raw payloads', () => {
  const csv = toCsv([tickerResult('PETR4', 'completo', 'indisponivel', 'parcial')]);

  assert.match(csv, /PETR4/);
  assert.doesNotMatch(csv, /sk_/);
  assert.doesNotMatch(csv, /rawPayload/);
});

function tickerResult(ticker, graham, bazin, fcd) {
  return {
    ticker,
    companyName: 'Empresa',
    sector: 'Setor',
    endpointErrors: {},
    inconsistencies: [],
    methods: {
      graham: { status: graham, fields: { lpa: 'available' } },
      bazin: { status: bazin, fields: { dividendsEndpoint: 'access_denied' }, completeYears: 0 },
      fcd: {
        status: fcd,
        fields: { scaleAndCurrency: 'missing' },
        annualYears: 0,
        quarterlyPeriods: 0,
      },
    },
  };
}
