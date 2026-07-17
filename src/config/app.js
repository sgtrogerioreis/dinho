const path = require('node:path');

const appConfig = Object.freeze({
  companyProvider: Object.freeze({
    driver: process.env.COMPANY_PROVIDER_DRIVER || 'local',
    filePath: path.resolve(__dirname, '../../data/companies.json'),
  }),
});

module.exports = appConfig;
