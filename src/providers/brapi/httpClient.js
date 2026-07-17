const axios = require('axios');

const { AccessDeniedError } = require('../../errors/accessDeniedError');
const { DataSourceError } = require('../../errors/dataSourceError');
const { InvalidCredentialError } = require('../../errors/invalidCredentialError');
const { MissingCredentialError } = require('../../errors/missingCredentialError');
const { NotFoundError } = require('../../errors/notFoundError');
const { RateLimitError } = require('../../errors/rateLimitError');
const { TemporaryDataSourceError } = require('../../errors/temporaryDataSourceError');

class BrapiHttpClient {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl;
    this.apiKey = options.apiKey || null;
    this.httpClient =
      options.httpClient ||
      (options.httpClientFactory || axios.create)(
        createHttpClientConfig({
          baseUrl: this.baseUrl,
          apiKey: this.apiKey,
          timeoutMs: options.timeoutMs,
        }),
      );
  }

  async getQuote(ticker) {
    return this.request('/stocks/quote', ticker);
  }

  async getStatistics(ticker) {
    return this.request('/stocks/statistics', ticker, {
      mode: 'current',
    });
  }

  async request(url, ticker, extraParams = {}) {
    try {
      const response = await this.httpClient.get(url, {
        params: {
          symbols: ticker,
          ...extraParams,
        },
      });

      return normalizeResponse(response.data, ticker);
    } catch (error) {
      throw mapBrapiHttpError(error, ticker);
    }
  }
}

function createHttpClientConfig(options = {}) {
  return {
    baseURL: options.baseUrl,
    timeout: options.timeoutMs,
    headers: buildAuthHeaders(options.apiKey),
  };
}

function buildAuthHeaders(apiKey) {
  if (!apiKey) {
    throw new MissingCredentialError('BRAPI_API_KEY is required for BRAPI requests.');
  }

  return {
    Authorization: `Bearer ${apiKey}`,
  };
}

function normalizeResponse(payload, ticker) {
  if (!payload || typeof payload !== 'object') {
    throw new DataSourceError(`BRAPI returned an invalid response for ticker "${ticker}".`);
  }

  if (payload.error === true) {
    throw mapBrapiPayloadError(payload, ticker);
  }

  if (!Array.isArray(payload.results) || payload.results.length === 0) {
    throw new NotFoundError(`No BRAPI results found for ticker "${ticker}".`);
  }

  const result = payload.results[0];

  if (!result || typeof result !== 'object' || !result.data || typeof result.data !== 'object') {
    throw new DataSourceError(`BRAPI returned invalid result data for ticker "${ticker}".`);
  }

  return result;
}

function mapBrapiPayloadError(payload, ticker) {
  if (payload.code === 'UNAUTHORIZED' || payload.code === 'INVALID_TOKEN') {
    return new InvalidCredentialError(`BRAPI authentication failed for ticker "${ticker}".`);
  }

  if (payload.code === 'MISSING_TOKEN') {
    return new MissingCredentialError(`BRAPI authentication is missing for ticker "${ticker}".`);
  }

  if (payload.code === 'FORBIDDEN' || payload.code === 'MODULES_NOT_AVAILABLE') {
    return new AccessDeniedError(`BRAPI access is not allowed for ticker "${ticker}".`);
  }

  if (payload.code === 'NOT_FOUND') {
    return new NotFoundError(`Ticker "${ticker}" was not found in BRAPI.`);
  }

  if (payload.code === 'RATE_LIMIT_EXCEEDED') {
    return new RateLimitError(`BRAPI rate limit exceeded for ticker "${ticker}".`);
  }

  if (payload.code === 'INTERNAL_SERVER_ERROR') {
    return new TemporaryDataSourceError(`BRAPI is temporarily unavailable for ticker "${ticker}".`);
  }

  return new DataSourceError(
    `BRAPI returned an application error for ticker "${ticker}": ${payload.message || 'unknown error'}.`,
  );
}

function mapBrapiHttpError(error, ticker) {
  if (
    error instanceof AccessDeniedError ||
    error instanceof DataSourceError ||
    error instanceof InvalidCredentialError ||
    error instanceof MissingCredentialError ||
    error instanceof NotFoundError ||
    error instanceof RateLimitError ||
    error instanceof TemporaryDataSourceError
  ) {
    return error;
  }

  if (error && error.code === 'ECONNABORTED') {
    return new TemporaryDataSourceError(`BRAPI request timed out for ticker "${ticker}".`);
  }

  const responseStatus = error && error.response ? error.response.status : null;
  const responseData = error && error.response ? error.response.data : null;

  if (responseData && typeof responseData === 'object' && responseData.error === true) {
    return mapBrapiPayloadError(responseData, ticker);
  }

  if (responseStatus === 401) {
    return new InvalidCredentialError(`BRAPI authentication failed for ticker "${ticker}".`);
  }

  if (responseStatus === 403) {
    return new AccessDeniedError(`BRAPI access is not allowed for ticker "${ticker}".`);
  }

  if (responseStatus === 404) {
    return new NotFoundError(`Ticker "${ticker}" was not found in BRAPI.`);
  }

  if (responseStatus === 429) {
    return new RateLimitError(`BRAPI rate limit exceeded for ticker "${ticker}".`);
  }

  if (responseStatus >= 500) {
    return new TemporaryDataSourceError(`BRAPI is temporarily unavailable for ticker "${ticker}".`);
  }

  if (responseStatus) {
    return new DataSourceError(
      `BRAPI request failed with status ${responseStatus} for ticker "${ticker}".`,
    );
  }

  return new TemporaryDataSourceError(`BRAPI request failed for ticker "${ticker}".`);
}

module.exports = {
  BrapiHttpClient,
  buildAuthHeaders,
  createHttpClientConfig,
  mapBrapiHttpError,
};
