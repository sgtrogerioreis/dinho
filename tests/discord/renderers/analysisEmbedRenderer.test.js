const test = require('node:test');
const assert = require('node:assert/strict');

const { ANALYSIS_STATUS } = require('../../../src/analysis/analysisStatus');
const { AnalysisResult } = require('../../../src/analysis/analysisResult');
const { NullLogoProvider } = require('../../../src/branding/logoProvider');
const {
  AnalysisEmbedRenderer,
  STATUS_COLORS,
  formatCompanyName,
  formatConsultedAt,
  formatDataReliability,
  formatExecutiveSummary,
  formatPotential,
  formatReferenceDate,
} = require('../../../src/discord/renderers/analysisEmbedRenderer');

const CONSULTED_AT = new Date('2026-07-18T17:26:00.000Z');

test('AnalysisEmbedRenderer renders UNDERVALUED as a release-candidate Graham report', () => {
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
    'Preço justo baseado na metodologia clássica de Benjamin Graham.',
  );
  assert.equal(embed.color, STATUS_COLORS.UNDERVALUED);
  assert.deepEqual(
    embed.fields.map((field) => field.name),
    [
      '🏢 Empresa',
      '💰 Preço Atual',
      '🎯 Preço Justo',
      '📈 Potencial',
      '🟢 Status',
      '​',
      'Resumo Executivo',
      '​',
      '🛡️ Margem de Segurança',
      '📊 LPA',
      '🏦 VPA',
      '💎 Preço Graham',
      '​',
      '🔎 Confiabilidade dos Dados',
      '📅 Dados Utilizados',
    ],
  );
  assert.equal(field(embed, '🏢 Empresa').value, 'PETROBRAS (PETR4)');
  assert.equal(field(embed, '💰 Preço Atual').value, `**R$\u00a040,90**`);
  assert.equal(field(embed, '🎯 Preço Justo').value, `**R$\u00a080,56**`);
  assert.equal(field(embed, '📈 Potencial').value, '🟢 **+96,96%**');
  assert.equal(field(embed, '🟢 Status').value, '**🟢 SUBAVALIADA**');
  assert.equal(
    field(embed, 'Resumo Executivo').value,
    '🟢 A ação negocia abaixo do preço justo calculado por Graham.',
  );
  assert.equal(field(embed, '🛡️ Margem de Segurança').value, '49,23%');
  assert.equal(field(embed, '📊 LPA').value, '8,35');
  assert.equal(field(embed, '🏦 VPA').value, '34,54');
  assert.equal(field(embed, '💎 Preço Graham').value, `R$\u00a080,56`);
  assert.equal(
    field(embed, '🔎 Confiabilidade dos Dados').value,
    ['🟢 Alta', 'Dados necessários encontrados.', 'Sem estimativas.'].join('\n'),
  );
  assert.equal(
    field(embed, '📅 Dados Utilizados').value,
    [
      `Preço: R$\u00a040,90`,
      'Fundamentos: 31/03/2026',
      'Consulta: 18/07/2026 às 14:26',
      'Fonte: BolsAI',
    ].join('\n'),
  );
  assert.equal(
    embed.footer.text,
    'Os cálculos utilizam fundamentos públicos da CVM processados pela BolsAI. O método Benjamin Graham não constitui recomendação de investimento.',
  );
});

test('AnalysisEmbedRenderer renders OVERVALUED with visual status and negative potential', () => {
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
  assert.equal(field(embed, '📈 Potencial').value, '🔴 **-72,61%**');
  assert.equal(field(embed, '🔴 Status').value, '**🔴 SOBREAVALIADA**');
  assert.equal(
    field(embed, 'Resumo Executivo').value,
    '🔴 A ação negocia acima do preço justo calculado por Graham.',
  );
});

test('AnalysisEmbedRenderer renders FAIR_VALUE with neutral visual status', () => {
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
  assert.equal(field(embed, '📈 Potencial').value, '🟢 **+2,00%**');
  assert.equal(field(embed, '🟡 Status').value, '**🟡 PREÇO JUSTO**');
  assert.equal(
    field(embed, 'Resumo Executivo').value,
    '🟡 A ação negocia próxima do preço justo calculado por Graham.',
  );
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
  assert.equal(field(embed, '🎯 Preço Justo').value, '**—**');
  assert.equal(field(embed, '📈 Potencial').value, '**—**');
  assert.equal(field(embed, '⚪ Status').value, '**⚪ NÃO APLICÁVEL**');
  assert.equal(
    field(embed, 'Resumo Executivo').value,
    '⚪ O método Graham não é aplicável devido aos fundamentos atuais.',
  );
  assert.equal(field(embed, '🛡️ Margem de Segurança').value, '—');
  assert.equal(field(embed, '📊 LPA').value, '-2,40');
  assert.equal(field(embed, '🏦 VPA').value, '0,88');
  assert.equal(field(embed, '💎 Preço Graham').value, '—');
  assert.equal(
    field(embed, '🔎 Confiabilidade dos Dados').value,
    ['⚪ Não aplicável', 'LPA e/ou VPA não positivos.'].join('\n'),
  );
});

test('AnalysisEmbedRenderer uses optional local attachment thumbnails', () => {
  const result = new AnalysisResult({
    method: 'GRAHAM',
    ticker: 'PETR4',
    companyName: 'PETROBRAS',
    currentPrice: 40.9,
    fairPrice: 80.55,
    marginOfSafety: 49.22,
    status: ANALYSIS_STATUS.UNDERVALUED,
    referenceDate: '2026-03-31',
    provider: 'BolsAI',
    inputs: {
      eps: 8.35,
      bookValuePerShare: 34.54,
    },
  });
  const resultWithoutLogo = new AnalysisResult({
    ...result,
    ticker: 'SEMLOGO3',
  });

  const withoutLogo = renderPayload(resultWithoutLogo);
  const withLogo = renderPayload(result, {
    logoProvider: {
      getAttachment() {
        return {
          name: 'PETR4.png',
          attachment: 'src/assets/logos/PETR4.png',
        };
      },
    },
  });
  const failingLogo = renderPayload(result, {
    logoProvider: {
      getAttachment() {
        throw new Error('logo unavailable');
      },
    },
  });

  assert.equal(withoutLogo.embeds[0].toJSON().thumbnail, undefined);
  assert.equal(withoutLogo.files, undefined);
  assert.equal(withLogo.embeds[0].toJSON().thumbnail.url, 'attachment://PETR4.png');
  assert.deepEqual(withLogo.files, [
    {
      name: 'PETR4.png',
      attachment: 'src/assets/logos/PETR4.png',
    },
  ]);
  assert.equal(failingLogo.embeds[0].toJSON().thumbnail, undefined);
  assert.equal(failingLogo.files, undefined);
  assert.equal(new NullLogoProvider().getAttachment('PETR4'), null);
});

test('AnalysisEmbedRenderer formats names, dates, potential, summaries and reliability', () => {
  assert.equal(formatCompanyName('PETRÓLEO BRASILEIRO S.A. - PETROBRAS'), 'PETROBRAS');
  assert.equal(formatCompanyName('VALE S.A.'), 'VALE');
  assert.equal(formatCompanyName('WEG SA'), 'WEG');
  assert.equal(formatReferenceDate('2026-03-31'), '31/03/2026');
  assert.equal(formatConsultedAt(CONSULTED_AT), '18/07/2026 às 14:26');
  assert.equal(formatPotential({ currentPrice: 40.9, fairPrice: 80.55558639846153 }), '🟢 +96,96%');
  assert.equal(
    formatExecutiveSummary({ status: ANALYSIS_STATUS.NOT_APPLICABLE }),
    '⚪ O método Graham não é aplicável devido aos fundamentos atuais.',
  );
  assert.equal(
    formatDataReliability({ status: ANALYSIS_STATUS.UNDERVALUED }),
    ['🟢 Alta', 'Dados necessários encontrados.', 'Sem estimativas.'].join('\n'),
  );
});

function render(result, options = {}) {
  return renderPayload(result, options).embeds[0].toJSON();
}

function renderPayload(result, options = {}) {
  return new AnalysisEmbedRenderer({
    logoProvider: options.logoProvider,
  }).render(result, {
    consultedAt: CONSULTED_AT,
  });
}

function field(embed, name) {
  return embed.fields.find((item) => item.name === name);
}
