const { ApiCompanyProvider } = require('./apiProvider');
const { createCompanyProvider } = require('./createCompanyProvider');
const { CompanyProvider } = require('./companyProvider');
const { LocalCompanyProvider } = require('./localProvider');

module.exports = {
  ApiCompanyProvider,
  createCompanyProvider,
  CompanyProvider,
  LocalCompanyProvider,
};
