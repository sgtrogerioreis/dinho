const path = require('node:path');

const appConfig = Object.freeze({
  companyProvider: Object.freeze({
    driver: process.env.PROVIDER || 'local',
    local: Object.freeze({
      filePath: path.resolve(__dirname, '../../data/companies.json'),
    }),
    api: Object.freeze({
      baseUrl: 'https://brapi.dev/api/v2',
      apiKey: readOptionalEnvironmentVariable('BRAPI_API_KEY'),
      timeoutMs: 10000,
    }),
    bolsai: Object.freeze({
      baseUrl: 'https://api.usebolsai.com/api/v1',
      apiKey: readOptionalEnvironmentVariable('BOLSAI_API_KEY'),
      timeoutMs: 10000,
      cacheTtlMs: 5 * 60 * 1000,
    }),
  }),
  permissions: Object.freeze({
    ownerRoleName: process.env.DISCORD_OWNER_ROLE_NAME || 'DONO',
  }),
});

function readOptionalEnvironmentVariable(variableName) {
  const value = process.env[variableName];

  if (typeof value !== 'string' || value.trim() === '') {
    return null;
  }

  return value.trim();
}

module.exports = appConfig;
