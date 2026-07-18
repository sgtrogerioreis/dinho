const fs = require('node:fs/promises');
const path = require('node:path');

const { AccessDeniedError } = require('../../errors/accessDeniedError');
const { BolsaiHttpClient } = require('./httpClient');
const { ENDPOINTS, FREE_DAILY_LIMIT, GRAHAM_ENDPOINTS } = require('./endpoints');
const { AuditStorage } = require('./storage');
const { RequestBudget, estimateRequests } = require('./requestBudget');
const { fetchIbovFromB3, loadLocalIbovReference } = require('./ibov');
const { normalizeTickerAudit } = require('./normalize');
const { writeReports } = require('./report');

const DEFAULT_DELAY_MS = 500;
const PILOT_TICKERS = ['PETR4', 'VALE3', 'ITUB4', 'BBAS3', 'WEGE3', 'TAEE11'];

async function runAudit(options = {}) {
  const requiredTickers = await loadRequiredTickers(options.requiredTickersPath);
  const ibov =
    options.requiredOnly || options.pilot
      ? { tickers: [] }
      : await loadIbovUniverse({ ...options, localOnly: options.grahamOnly });
  const universe = buildUniverse({
    requiredTickers: options.ibovOnly ? [] : requiredTickers,
    ibovTickers: options.requiredOnly ? [] : ibov.tickers,
    ticker: options.ticker,
    pilot: options.pilot,
  });
  const endpoints = options.grahamOnly ? GRAHAM_ENDPOINTS : ENDPOINTS;
  const storage = options.storage || new AuditStorage({ cacheDir: options.cacheDir });
  await storage.ensure();

  const cachedCount = await countCached(storage, universe.total, endpoints);
  const cachedCompletedTickers = await countCachedCompletedTickers(
    storage,
    universe.total,
    endpoints,
  );
  const estimatedRequests = estimateRequests(universe.total.length, endpoints.length, cachedCount);
  const panelUsedToday = options.panelUsedToday ?? (options.grahamOnly ? 18 : 0);
  const safetyMargin = options.safetyMargin ?? (options.grahamOnly ? 10 : 5);
  const dailyLimit = options.dailyLimit || FREE_DAILY_LIMIT;
  const safeNewRequestLimit = Math.max(dailyLimit - panelUsedToday - safetyMargin, 0);
  const batchSize = Number(options.batchSize || universe.total.length || 1);
  const estimate = {
    grahamOnly: Boolean(options.grahamOnly),
    tickers: universe.total.length,
    endpointsPerTicker: endpoints.length,
    cachedCompletedTickers,
    pendingTickers: universe.total.length - cachedCompletedTickers,
    cachedRequests: cachedCount,
    estimatedRequests,
    panelUsedToday,
    dailyLimit,
    safetyMargin,
    safeNewRequestLimit,
    fitsDailyLimit: estimatedRequests <= safeNewRequestLimit,
    batchSize,
    plannedBatches: Math.ceil(universe.total.length / batchSize),
    ibovSource: ibov.source || null,
    ibovReferenceDate: ibov.referenceDate || null,
  };

  if (options.dryRun) {
    return { dryRun: true, estimate, results: [] };
  }

  const apiKey = options.apiKey === undefined ? process.env.BOLSAI_API_KEY : options.apiKey;
  const client =
    options.client ||
    new BolsaiHttpClient({
      apiKey,
      timeoutMs: options.timeoutMs,
    });
  const budget = new RequestBudget({
    limit: dailyLimit - panelUsedToday,
    safetyMargin,
  });
  const tickersToRun = universe.total.slice(0, batchSize);
  const results = [];

  for (const ticker of tickersToRun) {
    const { payloads, errors, requestCount } = await auditTicker({
      ticker,
      endpoints,
      storage,
      client,
      budget,
      resume: options.resume,
      delayMs: options.delayMs ?? DEFAULT_DELAY_MS,
    });

    results.push(normalizeTickerAudit(ticker, payloads, errors));
    estimate.executedRequests = (estimate.executedRequests || 0) + requestCount;
  }

  const generatedAt = new Date().toISOString();
  const report = await writeReports({
    generatedAt,
    endpointsUsed: endpoints.map((endpoint) => endpoint.path),
    requestCount: estimate.executedRequests || 0,
    localRequestCount: estimate.executedRequests || 0,
    panelUsedToday,
    panelDifference: null,
    results,
    tickersByLayer: {
      required: universe.required,
      ibov: universe.ibov,
    },
  });

  return { dryRun: false, estimate, report, results };
}

async function auditTicker(options) {
  const payloads = {};
  const errors = {};
  let requestCount = 0;

  for (const endpoint of options.endpoints) {
    if (options.resume && (await options.storage.hasPayload(options.ticker, endpoint.key))) {
      payloads[endpoint.key] = await options.storage.readPayload(options.ticker, endpoint.key);
      continue;
    }

    if (options.resume && (await options.storage.hasError(options.ticker, endpoint.key))) {
      errors[endpoint.key] = await options.storage.readError(options.ticker, endpoint.key);
      continue;
    }

    if (!options.budget.canConsume(1)) {
      break;
    }

    try {
      options.budget.consume(1);
      requestCount += 1;
      const response = await options.client.requestEndpoint(endpoint, options.ticker);
      payloads[endpoint.key] = response.data;
      await options.storage.writePayload(options.ticker, endpoint.key, response.data);
      await delay(options.delayMs);
    } catch (error) {
      errors[endpoint.key] = sanitizeError(error);
      await options.storage.writeError(options.ticker, endpoint.key, errors[endpoint.key]);
      if (error instanceof AccessDeniedError) {
        continue;
      }
      break;
    }
  }

  return { payloads, errors, requestCount };
}

async function loadRequiredTickers(
  filePath = path.join(process.cwd(), 'data', 'bolsai-homologation-tickers.json'),
) {
  const payload = JSON.parse(await fs.readFile(filePath, 'utf8'));
  return payload.requiredTickers || [];
}

async function loadIbovUniverse(options) {
  if (options.ibovProvider) {
    return options.ibovProvider();
  }

  if (options.localOnly) {
    return loadLocalIbovReference();
  }

  try {
    const fromB3 = await fetchIbovFromB3();
    if (fromB3.tickers.length > 0) {
      return fromB3;
    }
  } catch {
    // Fall through to the versioned local reference.
  }

  return loadLocalIbovReference();
}

function buildUniverse(options) {
  const required = uniqueTickers(options.pilot ? PILOT_TICKERS : options.requiredTickers);
  const ibov = uniqueTickers(options.ibovTickers);
  const total = uniqueTickers([...(options.ticker ? [options.ticker] : []), ...required, ...ibov]);

  return {
    required: options.ticker ? total : required,
    ibov: options.ticker ? [] : ibov,
    total,
  };
}

function uniqueTickers(tickers = []) {
  return [...new Set(tickers.map((ticker) => String(ticker).trim().toUpperCase()).filter(Boolean))];
}

function sanitizeError(error) {
  if (error && error.code === 'ACCESS_DENIED_ERROR') {
    return { category: 'access_denied', code: error.code };
  }

  if (error && error.code === 'RATE_LIMIT_ERROR') {
    return { category: 'rate_limit', code: error.code };
  }

  if (error && error.code === 'INVALID_CREDENTIAL_ERROR') {
    return { category: 'invalid_credential', code: error.code };
  }

  if (error && error.code === 'MISSING_CREDENTIAL_ERROR') {
    return { category: 'missing_credential', code: error.code };
  }

  if (error && error.code === 'NOT_FOUND') {
    return { category: 'not_found', code: error.code };
  }

  return { category: 'request_error', code: error && error.code ? error.code : 'UNKNOWN' };
}

async function countCached(storage, tickers, endpoints) {
  let count = 0;

  for (const ticker of tickers) {
    for (const endpoint of endpoints) {
      if (await storage.hasPayload(ticker, endpoint.key)) {
        count += 1;
      } else if (await storage.hasError(ticker, endpoint.key)) {
        count += 1;
      }
    }
  }

  return count;
}

async function countCachedCompletedTickers(storage, tickers, endpoints) {
  let count = 0;

  for (const ticker of tickers) {
    let completed = true;

    for (const endpoint of endpoints) {
      if (
        !(await storage.hasPayload(ticker, endpoint.key)) &&
        !(await storage.hasError(ticker, endpoint.key))
      ) {
        completed = false;
      }
    }

    if (completed) {
      count += 1;
    }
  }

  return count;
}

function delay(ms) {
  if (!ms) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

module.exports = {
  auditTicker,
  buildUniverse,
  runAudit,
  sanitizeError,
};
