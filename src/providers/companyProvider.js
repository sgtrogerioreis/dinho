class CompanyProvider {
  async getCompanyByTicker() {
    throw new Error('CompanyProvider.getCompanyByTicker must be implemented.');
  }
}

module.exports = {
  CompanyProvider,
};
