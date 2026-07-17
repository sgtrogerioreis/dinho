const { createCompanyProvider } = require('./createCompanyProvider');
const { CompanyProvider } = require('./companyProvider');
const { LocalCompanyProvider } = require('./localProvider');

module.exports = {
  createCompanyProvider,
  CompanyProvider,
  LocalCompanyProvider,
};
