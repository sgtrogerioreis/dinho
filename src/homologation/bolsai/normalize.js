const { FIELD_STATUS, classifyValue, methodCoverage } = require('./fieldStatus');

const FINANCIAL_FIELD_PATTERNS = {
  netRevenue: [/receita liquida/i, /receita de venda/i],
  grossProfit: [/lucro bruto/i],
  ebit: [/resultado antes do resultado financeiro/i, /\bebit\b/i],
  netIncome: [/lucro.*periodo/i, /lucro liquido/i],
  cash: [/caixa/i, /equivalentes de caixa/i],
  totalAssets: [/ativo total/i],
  totalLiabilities: [/passivo total/i],
  equity: [/patrimonio liquido/i],
  operatingCashFlow: [/caixa liquido.*operacionais/i, /fluxo.*operacionais/i],
  capex: [/imobilizado/i, /capex/i],
};

function normalizeTickerAudit(ticker, payloads = {}, errors = {}) {
  const company = payloads.company || {};
  const quote = payloads.quote || {};
  const fundamentals = payloads.fundamentals || {};
  const dividends = payloads.dividends || {};
  const annualFinancials = payloads.financialsAnnual || {};
  const quarterlyFinancials = payloads.financialsQuarterly || {};

  const grahamFields = buildGrahamFields({ company, quote, fundamentals, errors });
  const bazinFields = buildBazinFields({ dividends, fundamentals, quote, errors });
  const fcdFields = buildFcdFields({
    fundamentals,
    annualFinancials,
    quarterlyFinancials,
    errors,
  });

  return {
    ticker,
    companyName:
      company.trade_name || company.corporate_name || fundamentals.corporate_name || null,
    sector: company.sector || null,
    methods: {
      graham: {
        status: classifyGraham(grahamFields),
        category: classifyGrahamCategory(grahamFields, errors),
        fields: grahamFields,
        checkValue: calculateGrahamCheckValue(fundamentals),
      },
      bazin: {
        status: classifyBazin(bazinFields),
        fields: bazinFields,
        annualDividends: Array.isArray(dividends.annual_summary) ? dividends.annual_summary : [],
        completeYears: countCompleteDividendYears(dividends.annual_summary),
      },
      fcd: {
        status: classifyFcd(fcdFields),
        fields: fcdFields,
        annualYears: countDistinctYears(annualFinancials.statements),
        quarterlyPeriods: countDistinctPeriods(quarterlyFinancials.statements),
      },
    },
    inconsistencies: buildInconsistencies({ fundamentals, dividends, annualFinancials }),
    endpointErrors: summarizeErrors(errors),
  };
}

function buildGrahamFields({ company, quote, fundamentals, errors }) {
  return {
    ticker: FIELD_STATUS.AVAILABLE,
    companyName: classifyValue(
      company.trade_name || company.corporate_name || fundamentals.corporate_name,
    ),
    currentPrice: classifyPositive(quote.close ?? fundamentals.close_price),
    quoteDateTime: classifyValue(quote.trade_date || fundamentals.reference_date),
    lpa: classifyPositive(fundamentals.lpa),
    vpa: classifyPositive(fundamentals.vpa),
    netIncome: classifyValue(fundamentals.net_income),
    equity: classifyValue(fundamentals.equity),
    sharesOutstanding: classifyPositive(fundamentals.shares_outstanding),
    fundamentalsEndpoint: errors.fundamentals
      ? errorToFieldStatus(errors.fundamentals)
      : FIELD_STATUS.AVAILABLE,
  };
}

function buildBazinFields({ dividends, fundamentals, quote, errors }) {
  if (errors.dividends) {
    return {
      dividendsEndpoint: errorToFieldStatus(errors.dividends),
      currentPrice: classifyPositive(quote.close ?? fundamentals.close_price),
    };
  }

  const payments = Array.isArray(dividends.payments) ? dividends.payments : [];

  return {
    dividendHistory: classifyArray(payments),
    jcpHistory: payments.some((payment) =>
      String(payment.type || '')
        .toLowerCase()
        .includes('jcp'),
    )
      ? FIELD_STATUS.AVAILABLE
      : FIELD_STATUS.MISSING,
    exDate: payments.every((payment) => payment.ex_date)
      ? FIELD_STATUS.AVAILABLE
      : classifyArray(payments),
    paymentDate: payments.every((payment) => payment.payment_date)
      ? FIELD_STATUS.AVAILABLE
      : classifyArray(payments),
    valuePerShare: payments.every((payment) => payment.value_per_share > 0)
      ? FIELD_STATUS.AVAILABLE
      : classifyArray(payments),
    type: payments.every((payment) => payment.type)
      ? FIELD_STATUS.AVAILABLE
      : classifyArray(payments),
    currency: FIELD_STATUS.MISSING,
    annualSummary: classifyArray(dividends.annual_summary),
    currentPrice: classifyPositive(
      dividends.current_price ?? quote.close ?? fundamentals.close_price,
    ),
    dividendYieldCurrent: classifyValue(
      dividends.dividend_yield_ttm ?? fundamentals.dividend_yield,
    ),
  };
}

function buildFcdFields({ fundamentals, annualFinancials, quarterlyFinancials, errors }) {
  if (errors.financialsAnnual && errors.financialsQuarterly) {
    return {
      financialsAnnualEndpoint: errorToFieldStatus(errors.financialsAnnual),
      financialsQuarterlyEndpoint: errorToFieldStatus(errors.financialsQuarterly),
      sharesOutstanding: classifyPositive(fundamentals.shares_outstanding),
    };
  }

  const annualMatches = extractFinancialCoverage(annualFinancials.statements);

  return {
    annualHistory:
      countDistinctYears(annualFinancials.statements) >= 5
        ? FIELD_STATUS.AVAILABLE
        : FIELD_STATUS.MISSING,
    quarterlyHistory:
      countDistinctPeriods(quarterlyFinancials.statements) > 0
        ? FIELD_STATUS.AVAILABLE
        : FIELD_STATUS.MISSING,
    netRevenue: annualMatches.netRevenue,
    ebitOrEbitda:
      annualMatches.ebit === FIELD_STATUS.AVAILABLE ||
      classifyValue(fundamentals.ebitda) === FIELD_STATUS.AVAILABLE
        ? FIELD_STATUS.AVAILABLE
        : FIELD_STATUS.MISSING,
    operatingCashFlow: annualMatches.operatingCashFlow,
    capex: annualMatches.capex,
    cash:
      annualMatches.cash === FIELD_STATUS.AVAILABLE
        ? FIELD_STATUS.AVAILABLE
        : classifyValue(fundamentals.cash),
    debt: classifyValue(fundamentals.total_debt ?? fundamentals.net_debt),
    sharesOutstanding: classifyPositive(fundamentals.shares_outstanding),
    scaleAndCurrency: FIELD_STATUS.MISSING,
  };
}

function classifyGraham(fields) {
  if (
    fields.currentPrice === FIELD_STATUS.AVAILABLE &&
    fields.quoteDateTime === FIELD_STATUS.AVAILABLE &&
    fields.lpa !== FIELD_STATUS.MISSING &&
    fields.lpa !== FIELD_STATUS.NULL &&
    fields.vpa !== FIELD_STATUS.MISSING &&
    fields.vpa !== FIELD_STATUS.NULL &&
    (fields.lpa !== FIELD_STATUS.AVAILABLE || fields.vpa !== FIELD_STATUS.AVAILABLE)
  ) {
    return 'not_applicable';
  }

  return methodCoverage({
    currentPrice: fields.currentPrice,
    lpa: fields.lpa,
    vpa: fields.vpa,
    quoteDateTime: fields.quoteDateTime,
  });
}

function classifyGrahamCategory(fields, errors) {
  if (errors.fundamentals && errors.fundamentals.category === 'access_denied') {
    return 'access_denied';
  }

  if (errors.fundamentals && errors.fundamentals.category === 'not_found') {
    return 'ticker_not_found';
  }

  if (errors.fundamentals) {
    return 'request_error';
  }

  if (fields.currentPrice !== FIELD_STATUS.AVAILABLE) {
    return 'missing_price';
  }

  if (fields.lpa === FIELD_STATUS.MISSING || fields.lpa === FIELD_STATUS.NULL) {
    return 'missing_eps';
  }

  if (fields.vpa === FIELD_STATUS.MISSING || fields.vpa === FIELD_STATUS.NULL) {
    return 'missing_bvps';
  }

  if (fields.lpa !== FIELD_STATUS.AVAILABLE || fields.vpa !== FIELD_STATUS.AVAILABLE) {
    return 'not_applicable';
  }

  if (fields.quoteDateTime !== FIELD_STATUS.AVAILABLE) {
    return 'inconsistent';
  }

  return 'complete';
}

function classifyBazin(fields) {
  if (fields.dividendsEndpoint === FIELD_STATUS.ACCESS_DENIED) {
    return 'indisponivel';
  }

  return methodCoverage({
    currentPrice: fields.currentPrice,
    dividendHistory: fields.dividendHistory,
    exDate: fields.exDate,
    paymentDate: fields.paymentDate,
    valuePerShare: fields.valuePerShare,
    type: fields.type,
  });
}

function classifyFcd(fields) {
  if (fields.financialsAnnualEndpoint === FIELD_STATUS.ACCESS_DENIED) {
    return 'indisponivel';
  }

  return methodCoverage({
    annualHistory: fields.annualHistory,
    netRevenue: fields.netRevenue,
    ebitOrEbitda: fields.ebitOrEbitda,
    operatingCashFlow: fields.operatingCashFlow,
    capex: fields.capex,
    cash: fields.cash,
    debt: fields.debt,
    sharesOutstanding: fields.sharesOutstanding,
    scaleAndCurrency: fields.scaleAndCurrency,
  });
}

function classifyPositive(value) {
  const status = classifyValue(value);
  if (status !== FIELD_STATUS.AVAILABLE) {
    return status;
  }

  return Number(value) > 0 ? FIELD_STATUS.AVAILABLE : FIELD_STATUS.INCONSISTENT;
}

function classifyArray(value) {
  return Array.isArray(value) && value.length > 0 ? FIELD_STATUS.AVAILABLE : FIELD_STATUS.MISSING;
}

function errorToFieldStatus(error) {
  if (error && error.category === 'access_denied') {
    return FIELD_STATUS.ACCESS_DENIED;
  }

  return FIELD_STATUS.REQUEST_ERROR;
}

function calculateGrahamCheckValue(fundamentals) {
  const lpa = Number(fundamentals.lpa);
  const vpa = Number(fundamentals.vpa);

  if (!Number.isFinite(lpa) || !Number.isFinite(vpa) || lpa <= 0 || vpa <= 0) {
    return null;
  }

  return Math.sqrt(22.5 * lpa * vpa);
}

function countCompleteDividendYears(annualSummary) {
  if (!Array.isArray(annualSummary)) {
    return 0;
  }

  return annualSummary.filter((year) => year && year.total_per_share > 0 && year.payments > 0)
    .length;
}

function countDistinctYears(statements) {
  const dates = distinctReferenceDates(statements);
  return new Set(dates.map((date) => String(date).slice(0, 4))).size;
}

function countDistinctPeriods(statements) {
  return distinctReferenceDates(statements).length;
}

function distinctReferenceDates(statements) {
  if (!Array.isArray(statements)) {
    return [];
  }

  return [
    ...new Set(statements.map((statement) => statement.reference_date).filter(Boolean)),
  ].sort();
}

function extractFinancialCoverage(statements) {
  const coverage = Object.fromEntries(
    Object.keys(FINANCIAL_FIELD_PATTERNS).map((field) => [field, FIELD_STATUS.MISSING]),
  );

  if (!Array.isArray(statements)) {
    return coverage;
  }

  for (const statement of statements) {
    const accountName = removeAccents(statement.account_name || '');
    for (const [field, patterns] of Object.entries(FINANCIAL_FIELD_PATTERNS)) {
      if (patterns.some((pattern) => pattern.test(accountName))) {
        coverage[field] = FIELD_STATUS.AVAILABLE;
      }
    }
  }

  return coverage;
}

function removeAccents(value) {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function buildInconsistencies({ fundamentals, dividends }) {
  const inconsistencies = [];

  addRelativeDifference(
    inconsistencies,
    'lpa_calculated_vs_provided',
    fundamentals.lpa,
    safeDivide(fundamentals.net_income, fundamentals.shares_outstanding),
  );
  addRelativeDifference(
    inconsistencies,
    'vpa_calculated_vs_provided',
    fundamentals.vpa,
    safeDivide(fundamentals.equity, fundamentals.shares_outstanding),
  );
  addRelativeDifference(
    inconsistencies,
    'net_debt_vs_total_debt_minus_cash',
    fundamentals.net_debt,
    safeSubtract(fundamentals.total_debt, fundamentals.cash),
  );

  if (
    dividends &&
    dividends.dividend_yield_ttm &&
    dividends.ttm_per_share &&
    dividends.current_price
  ) {
    addRelativeDifference(
      inconsistencies,
      'dividend_yield_calculated_vs_provided',
      dividends.dividend_yield_ttm,
      (dividends.ttm_per_share / dividends.current_price) * 100,
    );
  }

  return inconsistencies;
}

function addRelativeDifference(inconsistencies, name, provided, calculated) {
  if (
    !Number.isFinite(Number(provided)) ||
    !Number.isFinite(Number(calculated)) ||
    Number(provided) === 0
  ) {
    return;
  }

  const diffPct = Math.abs((Number(provided) - Number(calculated)) / Number(provided)) * 100;
  inconsistencies.push({
    name,
    provided: Number(provided),
    calculated: Number(calculated),
    diffPct,
  });
}

function safeDivide(left, right) {
  const numerator = Number(left);
  const denominator = Number(right);
  return Number.isFinite(numerator) && Number.isFinite(denominator) && denominator !== 0
    ? numerator / denominator
    : null;
}

function safeSubtract(left, right) {
  const a = Number(left);
  const b = Number(right);
  return Number.isFinite(a) && Number.isFinite(b) ? a - b : null;
}

function summarizeErrors(errors) {
  return Object.fromEntries(Object.entries(errors).map(([key, value]) => [key, value.category]));
}

module.exports = {
  countCompleteDividendYears,
  countDistinctPeriods,
  countDistinctYears,
  normalizeTickerAudit,
};
