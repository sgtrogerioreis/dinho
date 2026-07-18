const { EmbedBuilder } = require('discord.js');
const { ANALYSIS_STATUS } = require('../../analysis/analysisStatus');
const { NullLogoProvider } = require('../../branding/logoProvider');

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
  [ANALYSIS_STATUS.UNDERVALUED]: '🟢 SUBAVALIADA',
  [ANALYSIS_STATUS.FAIR_VALUE]: '🟡 PREÇO JUSTO',
  [ANALYSIS_STATUS.OVERVALUED]: '🔴 SOBREAVALIADA',
  [ANALYSIS_STATUS.NOT_APPLICABLE]: '⚪ NÃO APLICÁVEL',
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
  constructor(options = {}) {
    this.logoProvider = options.logoProvider || new NullLogoProvider();
  }

  render(result, options = {}) {
    const consultedAt = options.consultedAt || new Date();
    const embed = this.createBaseEmbed(result);
    const logoUrl = resolveLogoUrl(this.logoProvider, result);

    if (logoUrl) {
      embed.setThumbnail(logoUrl);
    }

    embed.addFields(...buildFields(result, consultedAt)).setFooter({
      text: 'Os cálculos utilizam fundamentos públicos da CVM processados pela BolsAI. O método Benjamin Graham não constitui recomendação de investimento.',
    });

    return {
      embeds: [embed],
    };
  }

  createBaseEmbed(result) {
    return new EmbedBuilder()
      .setTitle(resolveTitle(result.method))
      .setDescription(resolveDescription(result))
      .setColor(STATUS_COLORS[result.status] || STATUS_COLORS[ANALYSIS_STATUS.ERROR]);
  }
}

function buildFields(result, consultedAt) {
  return [
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
      value: bold(formatNullableCurrency(result.fairPrice)),
      inline: true,
    },
    {
      name: '📈 Potencial de Valorização',
      value: bold(formatPotential(result)),
      inline: true,
    },
    {
      name: 'Status',
      value: formatStatus(result),
      inline: false,
    },
    {
      name: 'Resumo Executivo',
      value: formatExecutiveSummary(result),
      inline: false,
    },
    {
      name: '📊 Indicadores',
      value: formatIndicators(result),
      inline: true,
    },
    {
      name: '🔎 Confiabilidade dos Dados',
      value: formatDataReliability(result),
      inline: true,
    },
    {
      name: '📅 Dados Utilizados',
      value: formatDataReference(result, consultedAt),
      inline: false,
    },
  ];
}

function resolveLogoUrl(logoProvider, result) {
  try {
    return logoProvider.getLogoUrl(result);
  } catch {
    return null;
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
    return 'Preço justo baseado na metodologia clássica de Benjamin Graham.';
  }

  return 'Preço justo baseado na metodologia clássica de Benjamin Graham.';
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
    `🛡️ Margem de Segurança: ${formatNullablePercentage(result.marginOfSafety)}`,
    `LPA: ${formatNumber(result.inputs.eps)}`,
    `VPA: ${formatNumber(result.inputs.bookValuePerShare)}`,
    `Graham: ${formatNullableCurrency(result.fairPrice)}`,
  ].join('\n');
}

function formatExecutiveSummary(result) {
  if (result.status === ANALYSIS_STATUS.UNDERVALUED) {
    return '🟢 A ação negocia abaixo do preço justo calculado por Graham.';
  }

  if (result.status === ANALYSIS_STATUS.FAIR_VALUE) {
    return '🟡 A ação negocia próxima do preço justo calculado por Graham.';
  }

  if (result.status === ANALYSIS_STATUS.OVERVALUED) {
    return '🔴 A ação negocia acima do preço justo calculado por Graham.';
  }

  if (result.status === ANALYSIS_STATUS.NOT_APPLICABLE) {
    return '⚪ O método Graham não é aplicável devido aos fundamentos atuais.';
  }

  return 'Não foi possível concluir a análise.';
}

function formatDataReliability(result) {
  if (result.status === ANALYSIS_STATUS.NOT_APPLICABLE) {
    return ['⚪ Não aplicável', 'LPA e/ou VPA não positivos.'].join('\n');
  }

  return ['🟢 Alta', 'Dados necessários encontrados.', 'Sem estimativas.'].join('\n');
}

function formatDataReference(result, consultedAt) {
  return [
    `Preço: ${formatCurrency(result.currentPrice)}`,
    `Fundamentos: ${formatReferenceDate(result.referenceDate)}`,
    `Consulta: ${formatConsultedAt(consultedAt)}`,
    `Fonte: ${result.provider || 'Nao informada'}`,
  ].join('\n');
}

function formatCompanyName(value) {
  if (!value) {
    return 'Empresa não informada';
  }

  const knownName = resolveKnownCompanyName(value);

  if (knownName) {
    return knownName;
  }

  const normalized = value
    .replace(/\s*S\.?A\.?.*$/i, '')
    .replace(/\s+-\s+.*$/u, '')
    .replace(/\s+/g, ' ')
    .trim();

  return normalized || value;
}

function resolveKnownCompanyName(value) {
  const upperValue = value.toUpperCase();
  const aliases = [
    ['PETROBRAS', 'PETROBRAS'],
    ['PETRÓLEO BRASILEIRO', 'PETROBRAS'],
    ['PETROLEO BRASILEIRO', 'PETROBRAS'],
    ['VALE', 'VALE'],
    ['WEG', 'WEG'],
    ['ITAÚ', 'ITAÚ'],
    ['ITAU', 'ITAÚ'],
    ['COSAN', 'COSAN'],
  ];

  const alias = aliases.find(([needle]) => upperValue.includes(needle));

  return alias ? alias[1] : null;
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
  formatCompanyName,
  formatDataReliability,
  formatExecutiveSummary,
  resolveLogoUrl,
};
