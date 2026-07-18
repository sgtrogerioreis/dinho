const axios = require('axios');

const { AccessDeniedError } = require('../../errors/accessDeniedError');
const { DataSourceError } = require('../../errors/dataSourceError');
const { InvalidCredentialError } = require('../../errors/invalidCredentialError');
const { MissingCredentialError } = require('../../errors/missingCredentialError');
const { NotFoundError } = require('../../errors/notFoundError');
const { RateLimitError } = require('../../errors/rateLimitError');
const { TemporaryDataSourceError } = require('../../errors/temporaryDataSourceError');

const BOLSAI_BASE_URL = 'https://api.usebolsai.com/api/v1';

class BolsaiHttpClient {
  constructor(options = {}) {
    this.httpClient =
      options.httpClient ||
      (options.httpClientFactory || axios.create)(
        createHttpClientConfig({
          baseUrl: options.baseUrl || BOLSAI_BASE_URL,
          apiKey: options.apiKey,
          timeoutMs: options.timeoutMs || 10000,
        }),
      );
  }

  async getFundamentals(ticker) {
    try {
      const response = await this.httpClient.get(`/fundamentals/${encodeURIComponent(ticker)}`);
      return normalizePayload(response.data, ticker);
    } catch (error) {
      throw mapBolsaiHttpError(error, ticker);
    }
  }
}

function createHttpClientConfig(options = {}) {
  return {
    baseURL: options.baseUrl || BOLSAI_BASE_URL,
    timeout: options.timeoutMs || 10000,
    headers: buildAuthHeaders(options.apiKey),
  };
}

function buildAuthHeaders(apiKey) {
  if (!apiKey) {
    throw new MissingCredentialError('BOLSAI_API_KEY is required for BolsAI requests.');
  }

  return {
    'X-API-Key': apiKey,
  };
}

function normalizePayload(payload, ticker) {
  if (!payload || typeof payload !== 'object') {
    throw new DataSourceError(`BolsAI returned an invalid response for ticker "${ticker}".`);
  }

  return payload;
}

function mapBolsaiHttpError(error, ticker) {
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

  if (error && (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT')) {
    return new TemporaryDataSourceError(`BolsAI request timed out for ticker "${ticker}".`);
  }

  const status = error && error.response ? error.response.status : null;

  if (status === 401) {
    return new InvalidCredentialError(`BolsAI authentication failed for ticker "${ticker}".`);
  }

  if (status === 403) {
    return new AccessDeniedError(`BolsAI access denied for ticker "${ticker}".`);
  }

  if (status === 404) {
    return new NotFoundError(`Ticker "${ticker}" was not found in BolsAI.`);
  }

  if (status === 429) {
    return new RateLimitError(`BolsAI rate limit exceeded for ticker "${ticker}".`);
  }

  if (status >= 500) {
    return new TemporaryDataSourceError(
      `BolsAI is temporarily unavailable for ticker "${ticker}".`,
    );
  }

  if (status >= 400) {
    return new DataSourceError(
      `BolsAI request failed with status ${status} for ticker "${ticker}".`,
    );
  }

  return new TemporaryDataSourceError(`BolsAI request failed for ticker "${ticker}".`);
}

module.exports = {
  BOLSAI_BASE_URL,
  BolsaiHttpClient,
  buildAuthHeaders,
  createHttpClientConfig,
  mapBolsaiHttpError,
};
