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
