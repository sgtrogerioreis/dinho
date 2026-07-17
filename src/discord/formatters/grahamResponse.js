const { EmbedBuilder } = require('discord.js');

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
  UNDERVALUED: 'Aparentemente abaixo do preço justo',
  FAIRLY_VALUED: 'Próxima do preço justo',
  OVERVALUED: 'Aparentemente acima do preço justo',
});

function formatGrahamResponse(valuationResult) {
  const embed = new EmbedBuilder()
    .setTitle('DINHO - Método de Graham')
    .setDescription('Estimativa matemática baseada no método de Graham.')
    .addFields(
      {
        name: 'Ticker',
        value: valuationResult.ticker,
        inline: true,
      },
      {
        name: 'Preço atual',
        value: formatCurrency(valuationResult.currentPrice),
        inline: true,
      },
      {
        name: 'Preço justo',
        value: formatCurrency(valuationResult.fairValue),
        inline: true,
      },
      {
        name: 'Margem de segurança',
        value: formatPercentage(valuationResult.marginOfSafety),
        inline: true,
      },
      {
        name: 'Situação',
        value: translateStatus(valuationResult.status),
        inline: true,
      },
      {
        name: 'Dados utilizados',
        value: `LPA: ${formatCurrency(valuationResult.inputs.eps)}\nVPA: ${formatCurrency(valuationResult.inputs.bookValuePerShare)}`,
      },
      {
        name: 'Fórmula',
        value: formatFormula(valuationResult.formula),
      },
    )
    .setFooter({
      text: 'Cálculo informativo. Não constitui recomendação de investimento.',
    });

  return {
    embeds: [embed],
  };
}

function formatCurrency(value) {
  return CURRENCY_FORMATTER.format(value);
}

function formatPercentage(value) {
  return `${PERCENTAGE_FORMATTER.format(value)}%`;
}

function translateStatus(status) {
  return STATUS_LABELS[status] || 'Situação indisponível';
}

function formatFormula(formula) {
  if (formula === 'sqrt(grahamMultiplier * EPS * BVPS)') {
    return '√(22,5 × LPA × VPA)';
  }

  return formula;
}

module.exports = {
  STATUS_LABELS,
  formatCurrency,
  formatFormula,
  formatGrahamResponse,
  formatPercentage,
  translateStatus,
};
