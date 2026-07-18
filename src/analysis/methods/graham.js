const assumptions = require('../../valuation/assumptions');
const { ANALYSIS_STATUS } = require('../analysisStatus');
const { AnalysisResult } = require('../analysisResult');

const GRAHAM_METHOD = 'GRAHAM';
const GRAHAM_FORMULA = 'sqrt(22.5 * LPA * VPA)';

function calculateGrahamAnalysis(input) {
  const eps = Number(input.eps);
  const bookValuePerShare = Number(input.bookValuePerShare);
  const currentPrice = Number(input.currentPrice);
  const warnings = [];

  if (eps <= 0 || bookValuePerShare <= 0) {
    warnings.push(
      'Empresa apresenta LPA e/ou VPA nao positivos. A formula de Benjamin Graham nao deve ser utilizada nessas condicoes.',
    );

    return new AnalysisResult({
      method: GRAHAM_METHOD,
      ticker: input.ticker,
      companyName: input.companyName,
      currentPrice,
      fairPrice: null,
      marginOfSafety: null,
      status: ANALYSIS_STATUS.NOT_APPLICABLE,
      referenceDate: input.referenceDate,
      provider: input.provider,
      inputs: {
        eps,
        bookValuePerShare,
      },
      warnings,
      metadata: {
        formula: GRAHAM_FORMULA,
        reason: 'LPA_OR_VPA_NOT_POSITIVE',
        ...(input.metadata || {}),
      },
    });
  }

  const fairPrice = Math.sqrt(assumptions.graham.grahamMultiplier * eps * bookValuePerShare);
  const marginOfSafety = ((fairPrice - currentPrice) / fairPrice) * 100;

  return new AnalysisResult({
    method: GRAHAM_METHOD,
    ticker: input.ticker,
    companyName: input.companyName,
    currentPrice,
    fairPrice,
    marginOfSafety,
    status: resolveAnalysisStatus(currentPrice, fairPrice),
    referenceDate: input.referenceDate,
    provider: input.provider,
    inputs: {
      eps,
      bookValuePerShare,
    },
    warnings,
    metadata: {
      formula: GRAHAM_FORMULA,
      assumptions: {
        grahamMultiplier: assumptions.graham.grahamMultiplier,
        fairValueTolerancePercentage: assumptions.graham.fairValueTolerancePercentage,
      },
      ...(input.metadata || {}),
    },
  });
}

function resolveAnalysisStatus(currentPrice, fairPrice) {
  const tolerance = assumptions.graham.fairValueTolerancePercentage / 100;
  const lowerBound = fairPrice * (1 - tolerance);
  const upperBound = fairPrice * (1 + tolerance);

  if (currentPrice < lowerBound) {
    return ANALYSIS_STATUS.UNDERVALUED;
  }

  if (currentPrice > upperBound) {
    return ANALYSIS_STATUS.OVERVALUED;
  }

  return ANALYSIS_STATUS.FAIR_VALUE;
}

module.exports = {
  GRAHAM_FORMULA,
  GRAHAM_METHOD,
  calculateGrahamAnalysis,
  resolveAnalysisStatus,
};
