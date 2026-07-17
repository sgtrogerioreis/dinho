const test = require('node:test');
const assert = require('node:assert/strict');

const {
  formatCurrency,
  formatFormula,
  formatGrahamResponse,
  formatPercentage,
  translateStatus,
} = require('../../../src/discord/formatters/grahamResponse');

test('graham formatter formats currency and percentages in pt-BR', () => {
  assert.equal(formatCurrency(34.5), 'R$\u00a034,50');
  assert.equal(formatPercentage(133.5532), '133,55%');
});

test('graham formatter translates all valuation statuses', () => {
  assert.equal(translateStatus('UNDERVALUED'), 'Aparentemente abaixo do preço justo');
  assert.equal(translateStatus('FAIRLY_VALUED'), 'Próxima do preço justo');
  assert.equal(translateStatus('OVERVALUED'), 'Aparentemente acima do preço justo');
});

test('graham formatter includes LPA, VPA, formula and disclaimer without mutating the result', () => {
  const valuationResult = Object.freeze({
    method: 'GRAHAM',
    ticker: 'PETR4',
    currentPrice: 34.5,
    fairValue: 80.5758617701356,
    marginOfSafety: 133.5532225221322,
    status: 'UNDERVALUED',
    inputs: Object.freeze({
      eps: 6.82,
      bookValuePerShare: 42.31,
    }),
    assumptions: Object.freeze({
      grahamMultiplier: 22.5,
      fairValueTolerancePercentage: 5,
    }),
    formula: 'sqrt(grahamMultiplier * EPS * BVPS)',
  });

  const response = formatGrahamResponse(valuationResult);
  const embed = response.embeds[0].toJSON();

  assert.equal(embed.title, 'DINHO - Método de Graham');
  assert.equal(
    embed.fields.some((field) => field.value.includes('LPA: R$\u00a06,82')),
    true,
  );
  assert.equal(
    embed.fields.some((field) => field.value.includes('VPA: R$\u00a042,31')),
    true,
  );
  assert.equal(
    embed.fields.some((field) => field.value === '√(22,5 × LPA × VPA)'),
    true,
  );
  assert.equal(
    embed.footer.text,
    'Cálculo informativo. Não constitui recomendação de investimento.',
  );
  assert.equal(formatFormula(valuationResult.formula), '√(22,5 × LPA × VPA)');
  assert.equal(valuationResult.inputs.eps, 6.82);
});
