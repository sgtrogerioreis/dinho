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
  [ANALYSIS_STATUS.UNDERVALUED]: '🟢 Subavaliada',
  [ANALYSIS_STATUS.FAIR_VALUE]: '🟡 Próxima do preço justo',
  [ANALYSIS_STATUS.OVERVALUED]: '🔴 Acima do preço justo',
  [ANALYSIS_STATUS.NOT_APPLICABLE]: '⚪ Graham não aplicável',
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
  render(result, options = {}) {
    const consultedAt = options.consultedAt || new Date();
    const embed = new EmbedBuilder()
      .setTitle(resolveTitle(result.method))
      .setDescription(resolveDescription(result))
      .setColor(STATUS_COLORS[result.status] || STATUS_COLORS[ANALYSIS_STATUS.ERROR])
      .addFields(
        {
          name: '🏢 Empresa',
          value: `${formatCompanyName(result.companyName)}\n${result.ticker || 'Ticker nao informado'}`,
          inline: false,
        },
        {
          name: '💰 Preço Atual',
          value: bold(formatCurrency(result.currentPrice)),
          inline: true,
        },
        {
          name: '🎯 Preço Justo',
          value: formatNullableCurrency(result.fairPrice),
          inline: true,
        },
        {
          name: '📈 Potencial',
          value: formatPotential(result),
          inline: true,
        },
        {
          name: 'Status',
          value: formatStatus(result),
          inline: false,
        },
        {
          name: '📊 Indicadores',
          value: formatIndicators(result),
          inline: true,
        },
        {
          name: '📅 Dados Utilizados',
          value: formatDataReference(result, consultedAt),
          inline: true,
        },
        {
          name: 'Observacao',
          value: formatObservation(result),
          inline: false,
        },
      )
      .setFooter({
        text: 'O método Graham utiliza empresas com LPA e VPA positivos para estimar um preço justo teórico.',
      });

    return {
      embeds: [embed],
    };
  }
}

function resolveTitle(method) {
  if (method === 'GRAHAM') {
    return '🧮 Benjamin Graham';
  }

  return method;
}

function resolveDescription(result) {
  if (result.status === ANALYSIS_STATUS.NOT_APPLICABLE) {
    return 'Avaliação de preço justo utilizando a metodologia clássica de Benjamin Graham.';
  }

  return 'Avaliação de preço justo utilizando a metodologia clássica de Benjamin Graham.';
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
    : '—';
}

function formatNullablePercentage(value) {
  return value !== null && value !== undefined && Number.isFinite(Number(value))
    ? `${PERCENTAGE_FORMATTER.format(value)}%`
    : '—';
}

function formatNumber(value) {
  return Number.isFinite(Number(value)) ? PERCENTAGE_FORMATTER.format(value) : 'Nao informado';
}

function formatPotential(result) {
  if (result.fairPrice === null || result.fairPrice === undefined) {
    return '—';
  }

  const currentPrice = Number(result.currentPrice);
  const fairPrice = Number(result.fairPrice);

  if (!Number.isFinite(currentPrice) || currentPrice <= 0 || !Number.isFinite(fairPrice)) {
    return '—';
  }

  const potential = ((fairPrice - currentPrice) / currentPrice) * 100;
  const sign = potential > 0 ? '+' : '';
  const icon = potential > 0 ? '🟢 ' : potential < 0 ? '🔴 ' : '🟡 ';

  return `${icon}${sign}${formatPercentage(potential)}`;
}

function formatPercentage(value) {
  return `${PERCENTAGE_FORMATTER.format(value)}%`;
}

function formatIndicators(result) {
  return [
    `LPA: ${formatNumber(result.inputs.eps)}`,
    `VPA: ${formatNumber(result.inputs.bookValuePerShare)}`,
    `Margem: ${formatNullablePercentage(result.marginOfSafety)}`,
    `Graham: ${formatNullableCurrency(result.fairPrice)}`,
  ].join('\n');
}

function formatDataReference(result, consultedAt) {
  return [
    `Preço: ${formatCurrency(result.currentPrice)}`,
    `Fundamentos: ${formatReferenceDate(result.referenceDate)}`,
    `Consulta: ${formatConsultedAt(consultedAt)}`,
    `Fonte: ${result.provider || 'Nao informada'}`,
  ].join('\n');
}

function formatObservation(result) {
  if (result.status === ANALYSIS_STATUS.NOT_APPLICABLE) {
    return 'Empresa apresenta LPA e/ou VPA não positivos.';
  }

  return 'Margem de segurança e potencial de valorização são indicadores diferentes.';
}

function formatCompanyName(value) {
  if (!value) {
    return 'Empresa não informada';
  }

  const normalized = value
    .replace(/\s*S\.?A\.?.*$/i, '')
    .replace(/\s+-\s+.*$/u, '')
    .replace(/\s+/g, ' ')
    .trim();

  return normalized || value;
}

function bold(value) {
  return `**${value}**`;
}

function formatReferenceDate(value) {
  if (!value || typeof value !== 'string') {
    return 'Nao informada';
  }

  const [year, month, day] = value.split('-');

  if (!year || !month || !day) {
    return value;
  }

  return `${day}/${month}/${year}`;
}

function formatConsultedAt(value) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Nao informado';
  }

  const parts = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);

  return `${readPart(parts, 'day')}/${readPart(parts, 'month')}/${readPart(
    parts,
    'year',
  )} às ${readPart(parts, 'hour')}:${readPart(parts, 'minute')}`;
}

function readPart(parts, type) {
  return parts.find((part) => part.type === type)?.value || '';
}

module.exports = {
  AnalysisEmbedRenderer,
  STATUS_COLORS,
  STATUS_LABELS,
  formatConsultedAt,
  formatCurrency,
  formatNullableCurrency,
  formatNullablePercentage,
  formatNumber,
  formatPotential,
  formatReferenceDate,
};
