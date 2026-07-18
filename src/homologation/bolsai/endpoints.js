const BOLSAI_BASE_URL = 'https://api.usebolsai.com/api/v1';
const FREE_DAILY_LIMIT = 200;

const ENDPOINTS = [
  {
    key: 'company',
    method: 'GET',
    path: '/companies/{ticker}',
    tier: 'free',
    perTicker: true,
  },
  {
    key: 'quote',
    method: 'GET',
    path: '/stocks/{ticker}/quote',
    tier: 'free',
    perTicker: true,
  },
  {
    key: 'fundamentals',
    method: 'GET',
    path: '/fundamentals/{ticker}',
    tier: 'free',
    perTicker: true,
  },
  {
    key: 'fundamentalsHistory',
    method: 'GET',
    path: '/fundamentals/{ticker}/history',
    tier: 'pro',
    perTicker: true,
    params: { limit: 40 },
  },
  {
    key: 'dividends',
    method: 'GET',
    path: '/dividends/{ticker}',
    tier: 'pro',
    perTicker: true,
    params: { years: 5 },
  },
  {
    key: 'financialsAnnual',
    method: 'GET',
    path: '/financials/{ticker}',
    tier: 'pro',
    perTicker: true,
    params: { report_type: 'DFP', limit: 5000 },
  },
  {
    key: 'financialsQuarterly',
    method: 'GET',
    path: '/financials/{ticker}',
    tier: 'pro',
    perTicker: true,
    params: { report_type: 'ITR', limit: 5000 },
  },
];

const GRAHAM_ENDPOINTS = [
  {
    key: 'fundamentals',
    method: 'GET',
    path: '/fundamentals/{ticker}',
    tier: 'free',
    perTicker: true,
  },
];

const IBOV_ENDPOINT = {
  key: 'ibovPortfolio',
  method: 'GET',
  path: '/indexes/IBOV/portfolio',
  tier: 'unknown',
  availableInDocs: false,
};

function endpointPath(endpoint, ticker) {
  return endpoint.path.replace('{ticker}', encodeURIComponent(ticker));
}

module.exports = {
  BOLSAI_BASE_URL,
  ENDPOINTS,
  FREE_DAILY_LIMIT,
  GRAHAM_ENDPOINTS,
  IBOV_ENDPOINT,
  endpointPath,
};
