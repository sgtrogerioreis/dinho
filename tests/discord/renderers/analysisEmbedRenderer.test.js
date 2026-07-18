const test = require('node:test');
const assert = require('node:assert/strict');

const { ANALYSIS_STATUS } = require('../../../src/analysis/analysisStatus');
const { AnalysisResult } = require('../../../src/analysis/analysisResult');
const {
  AnalysisEmbedRenderer,
  STATUS_COLORS,
} = require('../../../src/discord/renderers/analysisEmbedRenderer');

test('AnalysisEmbedRenderer renders a Graham analysis result', () => {
  const result = new AnalysisResult({
    method: 'GRAHAM',
    ticker: 'PETR4',
    companyName: 'PETROBRAS',
    currentPrice: 30,
    fairPrice: 80.55,
    marginOfSafety: 62.75,
    status: ANALYSIS_STATUS.UNDERVALUED,
    referenceDate: '2026-07-17',
    provider: 'BolsAI',
    inputs: {
      eps: 8.35,
      bookValuePerShare: 34.54,
    },
  });

  const embed = new AnalysisEmbedRenderer().render(result).embeds[0].toJSON();

  assert.equal(embed.title, 'Benjamin Graham');
  assert.equal(embed.description, 'Analise de preco justo.');
  assert.equal(embed.color, STATUS_COLORS.UNDERVALUED);
  assert.equal(embed.footer.text, 'Dados fornecidos por BolsAI.');
  assert.equal(
    embed.fields.some((field) => field.name === 'Fonte dos Dados' && field.value === 'BolsAI'),
    true,
  );
});

test('AnalysisEmbedRenderer renders NOT_APPLICABLE without fair price', () => {
  const result = new AnalysisResult({
    method: 'GRAHAM',
    ticker: 'CSAN3',
    currentPrice: 10,
    status: ANALYSIS_STATUS.NOT_APPLICABLE,
    referenceDate: '2026-07-17',
    provider: 'BolsAI',
    inputs: {
      eps: -1,
      bookValuePerShare: 5,
    },
  });

  const embed = new AnalysisEmbedRenderer().render(result).embeds[0].toJSON();

  assert.match(embed.description, /Graham nao aplicavel/);
  assert.equal(embed.color, STATUS_COLORS.NOT_APPLICABLE);
  assert.equal(embed.fields.find((field) => field.name === 'Preco Graham').value, 'Nao aplicavel');
});
