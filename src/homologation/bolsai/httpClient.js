const axios = require('axios');

const { AccessDeniedError } = require('../../errors/accessDeniedError');
const { DataSourceError } = require('../../errors/dataSourceError');
const { InvalidCredentialError } = require('../../errors/invalidCredentialError');
const { MissingCredentialError } = require('../../errors/missingCredentialError');
const { NotFoundError } = require('../../errors/notFoundError');
const { RateLimitError } = require('../../errors/rateLimitError');
const { TemporaryDataSourceError } = require('../../errors/temporaryDataSourceError');
const { BOLSAI_BASE_URL, endpointPath } = require('./endpoints');

class BolsaiHttpClient {
  constructor(options = {}) {
    this.apiKey = options.apiKey || null;
    this.httpClient =
      options.httpClient ||
      (options.httpClientFactory || axios.create)(
        createHttpClientConfig({
          apiKey: this.apiKey,
          baseUrl: options.baseUrl || BOLSAI_BASE_URL,
          timeoutMs: options.timeoutMs || 15000,
        }),
      );
  }

  async requestEndpoint(endpoint, ticker) {
    return this.request(endpointPath(endpoint, ticker), {
      ticker,
      params: endpoint.params || {},
    });
  }

  async request(path, options = {}) {
    try {
      const response = await this.httpClient.get(path, { params: options.params || {} });
      return {
        data: normalizePayload(response.data, options.ticker || path),
        rateLimitRemaining: readRateLimitRemaining(response.headers || {}),
      };
    } catch (error) {
      throw mapBolsaiHttpError(error, options.ticker || path);
    }
  }
}

function createHttpClientConfig(options = {}) {
  return {
    baseURL: options.baseUrl || BOLSAI_BASE_URL,
    timeout: options.timeoutMs || 15000,
    headers: buildAuthHeaders(options.apiKey),
  };
}

function buildAuthHeaders(apiKey) {
  if (!apiKey) {
    throw new MissingCredentialError(
      'BOLSAI_API_KEY is required for BolsAI homologation requests.',
    );
  }

  return {
    'X-API-Key': apiKey,
  };
}

function normalizePayload(payload, context) {
  if (!payload || typeof payload !== 'object') {
    throw new DataSourceError(`BolsAI returned an invalid response for "${context}".`);
  }

  return payload;
}

function readRateLimitRemaining(headers) {
  const key = Object.keys(headers).find(
    (header) => header.toLowerCase() === 'x-ratelimit-remaining',
  );
  if (!key) {
    return null;
  }

  const remaining = Number(headers[key]);
  return Number.isFinite(remaining) ? remaining : null;
}

function mapBolsaiHttpError(error, context) {
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
    return new TemporaryDataSourceError(`BolsAI request timed out for "${context}".`);
  }

  const status = error && error.response ? error.response.status : null;

  if (status === 401) {
    return new InvalidCredentialError(`BolsAI authentication failed for "${context}".`);
  }

  if (status === 403) {
    return new AccessDeniedError(`BolsAI endpoint is not available for "${context}".`);
  }

  if (status === 404) {
    return new NotFoundError(`BolsAI resource was not found for "${context}".`);
  }

  if (status === 429) {
    return new RateLimitError(`BolsAI daily rate limit exceeded for "${context}".`);
  }

  if (status >= 500) {
    return new TemporaryDataSourceError(`BolsAI is temporarily unavailable for "${context}".`);
  }

  if (status >= 400) {
    return new DataSourceError(`BolsAI request failed with status ${status} for "${context}".`);
  }

  return new TemporaryDataSourceError(`BolsAI request failed for "${context}".`);
}

module.exports = {
  BolsaiHttpClient,
  buildAuthHeaders,
  createHttpClientConfig,
  mapBolsaiHttpError,
  readRateLimitRemaining,
};
