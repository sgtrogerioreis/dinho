const { EmbedBuilder } = require('discord.js');
const { ANALYSIS_STATUS } = require('../../analysis/analysisStatus');

const CURRENCY_FORMATTER = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const PERCENTAGE_FORMATTER = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const STATUS_LABELS = Object.freeze({
  [ANALYSIS_STATUS.UNDERVALUED]: 'Abaixo do preco justo',
  [ANALYSIS_STATUS.FAIR_VALUE]: 'Proximo do preco justo',
  [ANALYSIS_STATUS.OVERVALUED]: 'Acima do preco justo',
  [ANALYSIS_STATUS.NOT_APPLICABLE]: 'Graham nao aplicavel',
  [ANALYSIS_STATUS.ERROR]: 'Erro',
});

const STATUS_COLORS = Object.freeze({
  [ANALYSIS_STATUS.UNDERVALUED]: 0x2ecc71,
  [ANALYSIS_STATUS.FAIR_VALUE]: 0xf1c40f,
  [ANALYSIS_STATUS.OVERVALUED]: 0xe74c3c,
  [ANALYSIS_STATUS.NOT_APPLICABLE]: 0x95a5a6,
  [ANALYSIS_STATUS.ERROR]: 0xe67e22,
});

class AnalysisEmbedRenderer {
  render(result) {
    const embed = new EmbedBuilder()
      .setTitle(resolveTitle(result.method))
      .setDescription(resolveDescription(result))
      .setColor(STATUS_COLORS[result.status] || STATUS_COLORS[ANALYSIS_STATUS.ERROR])
      .addFields(
        {
          name: 'Empresa',
          value: result.companyName || 'Nao informada',
          inline: false,
        },
        {
          name: 'Ticker',
          value: result.ticker,
          inline: true,
        },
        {
          name: 'Preco Atual',
          value: formatCurrency(result.currentPrice),
          inline: true,
        },
        {
          name: 'Preco Graham',
          value: formatNullableCurrency(result.fairPrice),
          inline: true,
        },
        {
          name: 'Margem de Seguranca',
          value: formatNullablePercentage(result.marginOfSafety),
          inline: true,
        },
        {
          name: 'LPA',
          value: formatNumber(result.inputs.eps),
          inline: true,
        },
        {
          name: 'VPA',
          value: formatNumber(result.inputs.bookValuePerShare),
          inline: true,
        },
        {
          name: 'Status',
          value: formatStatus(result),
          inline: false,
        },
        {
          name: 'Data da Cotacao',
          value: result.referenceDate || 'Nao informada',
          inline: true,
        },
        {
          name: 'Fonte dos Dados',
          value: result.provider || 'Nao informada',
          inline: true,
        },
      )
      .setFooter({
        text: 'Dados fornecidos por BolsAI.',
      });

    return {
      embeds: [embed],
    };
  }
}

function resolveTitle(method) {
  if (method === 'GRAHAM') {
    return 'Benjamin Graham';
  }

  return method;
}

function resolveDescription(result) {
  if (result.status === ANALYSIS_STATUS.NOT_APPLICABLE) {
    return 'Analise de preco justo.\n\nGraham nao aplicavel.\nEmpresa apresenta LPA e/ou VPA nao positivos.\nA formula de Benjamin Graham nao deve ser utilizada nessas condicoes.';
  }

  return 'Analise de preco justo.';
}

function formatStatus(result) {
  return STATUS_LABELS[result.status] || STATUS_LABELS[ANALYSIS_STATUS.ERROR];
}

function formatCurrency(value) {
  return CURRENCY_FORMATTER.format(value);
}

function formatNullableCurrency(value) {
  return value !== null && value !== undefined && Number.isFinite(Number(value))
    ? formatCurrency(value)
    : 'Nao aplicavel';
}

function formatNullablePercentage(value) {
  return value !== null && value !== undefined && Number.isFinite(Number(value))
    ? `${PERCENTAGE_FORMATTER.format(value)}%`
    : 'Nao aplicavel';
}

function formatNumber(value) {
  return Number.isFinite(Number(value)) ? PERCENTAGE_FORMATTER.format(value) : 'Nao informado';
}

module.exports = {
  AnalysisEmbedRenderer,
  STATUS_COLORS,
  STATUS_LABELS,
  formatCurrency,
  formatNullableCurrency,
  formatNullablePercentage,
  formatNumber,
};
