const test = require('node:test');
const assert = require('node:assert/strict');

const { ANALYSIS_STATUS } = require('../../../src/analysis/analysisStatus');
const { AnalysisResult } = require('../../../src/analysis/analysisResult');
const {
  AnalysisEmbedRenderer,
  STATUS_COLORS,
  formatConsultedAt,
  formatPotential,
  formatReferenceDate,
} = require('../../../src/discord/renderers/analysisEmbedRenderer');

const CONSULTED_AT = new Date('2026-07-18T17:26:00.000Z');

test('AnalysisEmbedRenderer renders UNDERVALUED as a professional Graham report', () => {
  const embed = render(
    new AnalysisResult({
      method: 'GRAHAM',
      ticker: 'PETR4',
      companyName: 'PETRÓLEO BRASILEIRO S.A. - PETROBRAS',
      currentPrice: 40.9,
      fairPrice: 80.55558639846153,
      marginOfSafety: 49.22760564650161,
      status: ANALYSIS_STATUS.UNDERVALUED,
      referenceDate: '2026-03-31',
      provider: 'BolsAI',
      inputs: {
        eps: 8.35,
        bookValuePerShare: 34.54,
      },
    }),
  );

  assert.equal(embed.title, '🧮 Benjamin Graham');
  assert.equal(
    embed.description,
    'Avaliação de preço justo utilizando a metodologia clássica de Benjamin Graham.',
  );
  assert.equal(embed.color, STATUS_COLORS.UNDERVALUED);
  assert.deepEqual(
    embed.fields.map((field) => field.name),
    [
      '🏢 Empresa',
      '💰 Preço Atual',
      '🎯 Preço Justo',
      '📈 Potencial',
      'Status',
      '📊 Indicadores',
      '📅 Dados Utilizados',
      'Observacao',
    ],
  );
  assert.equal(field(embed, '🏢 Empresa').value, 'PETRÓLEO BRASILEIRO\nPETR4');
  assert.equal(field(embed, '💰 Preço Atual').value, '**R$ 40,90**');
  assert.equal(field(embed, '🎯 Preço Justo').value, 'R$ 80,56');
  assert.equal(field(embed, '📈 Potencial').value, '🟢 +96,96%');
  assert.equal(field(embed, 'Status').value, '🟢 Subavaliada');
  assert.equal(
    field(embed, '📊 Indicadores').value,
    ['LPA: 8,35', 'VPA: 34,54', 'Margem: 49,23%', 'Graham: R$ 80,56'].join('\n'),
  );
  assert.equal(
    field(embed, '📅 Dados Utilizados').value,
    [
      'Preço: R$ 40,90',
      'Fundamentos: 31/03/2026',
      'Consulta: 18/07/2026 às 14:26',
      'Fonte: BolsAI',
    ].join('\n'),
  );
  assert.equal(
    field(embed, 'Observacao').value,
    'Margem de segurança e potencial de valorização são indicadores diferentes.',
  );
  assert.equal(
    embed.footer.text,
    'O método Graham utiliza empresas com LPA e VPA positivos para estimar um preço justo teórico.',
  );
  assert.equal(
    embed.fields.some((item) => item.name === 'Data da Cotacao'),
    false,
  );
});

test('AnalysisEmbedRenderer renders OVERVALUED with negative potential', () => {
  const embed = render(
    new AnalysisResult({
      method: 'GRAHAM',
      ticker: 'WEGE3',
      companyName: 'WEG SA',
      currentPrice: 43.63,
      fairPrice: 11.948326242616579,
      marginOfSafety: -265.1557474584441,
      status: ANALYSIS_STATUS.OVERVALUED,
      referenceDate: '2026-03-31',
      provider: 'BolsAI',
      inputs: {
        eps: 1.5,
        bookValuePerShare: 4.23,
      },
    }),
  );

  assert.equal(embed.color, STATUS_COLORS.OVERVALUED);
  assert.equal(field(embed, '📈 Potencial').value, '🔴 -72,61%');
  assert.equal(field(embed, 'Status').value, '🔴 Acima do preço justo');
});

test('AnalysisEmbedRenderer renders FAIR_VALUE with neutral status', () => {
  const embed = render(
    new AnalysisResult({
      method: 'GRAHAM',
      ticker: 'FAIR3',
      companyName: 'EMPRESA JUSTA S.A.',
      currentPrice: 100,
      fairPrice: 102,
      marginOfSafety: 1.9607843137254901,
      status: ANALYSIS_STATUS.FAIR_VALUE,
      referenceDate: '2026-03-31',
      provider: 'BolsAI',
      inputs: {
        eps: 4,
        bookValuePerShare: 10,
      },
    }),
  );

  assert.equal(embed.color, STATUS_COLORS.FAIR_VALUE);
  assert.equal(field(embed, '📈 Potencial').value, '🟢 +2,00%');
  assert.equal(field(embed, 'Status').value, '🟡 Próxima do preço justo');
});

test('AnalysisEmbedRenderer renders NOT_APPLICABLE without financial projections', () => {
  const embed = render(
    new AnalysisResult({
      method: 'GRAHAM',
      ticker: 'CSAN3',
      companyName: 'COSAN S.A.',
      currentPrice: 3.84,
      fairPrice: null,
      marginOfSafety: null,
      status: ANALYSIS_STATUS.NOT_APPLICABLE,
      referenceDate: '2026-03-31',
      provider: 'BolsAI',
      inputs: {
        eps: -2.4,
        bookValuePerShare: 0.88,
      },
    }),
  );

  assert.equal(embed.color, STATUS_COLORS.NOT_APPLICABLE);
  assert.equal(field(embed, '🎯 Preço Justo').value, '—');
  assert.equal(field(embed, '📈 Potencial').value, '—');
  assert.equal(field(embed, 'Status').value, '⚪ Graham não aplicável');
  assert.equal(
    field(embed, '📊 Indicadores').value,
    ['LPA: -2,40', 'VPA: 0,88', 'Margem: —', 'Graham: —'].join('\n'),
  );
  assert.equal(field(embed, 'Observacao').value, 'Empresa apresenta LPA e/ou VPA não positivos.');
});

test('AnalysisEmbedRenderer formats dates and potential values', () => {
  assert.equal(formatReferenceDate('2026-03-31'), '31/03/2026');
  assert.equal(formatConsultedAt(CONSULTED_AT), '18/07/2026 às 14:26');
  assert.equal(formatPotential({ currentPrice: 40.9, fairPrice: 80.55558639846153 }), '🟢 +96,96%');
  assert.equal(
    formatPotential({ currentPrice: 43.63, fairPrice: 11.948326242616579 }),
    '🔴 -72,61%',
  );
});

function render(result) {
  return new AnalysisEmbedRenderer()
    .render(result, {
      consultedAt: CONSULTED_AT,
    })
    .embeds[0].toJSON();
}

function field(embed, name) {
  return embed.fields.find((item) => item.name === name);
}
