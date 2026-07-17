const { validateCompanyData } = require('../validators/companyValidator');

class Company {
  constructor(data) {
    this.ticker = data.ticker;
    this.name = data.name;
    this.price = data.price;
    this.eps = data.eps;
    this.bookValuePerShare = data.bookValuePerShare;
    this.annualDividend = data.annualDividend;
    this.fcf = data.fcf;
    this.sharesOutstanding = data.sharesOutstanding;
    this.netDebt = data.netDebt;
  }

  static fromRaw(rawCompany) {
    validateCompanyData(rawCompany);
    return new Company({
      ticker: rawCompany.ticker.trim().toUpperCase(),
      name: rawCompany.name.trim(),
      price: rawCompany.price,
      eps: rawCompany.eps,
      bookValuePerShare: rawCompany.bookValuePerShare,
      annualDividend: rawCompany.annualDividend,
      fcf: rawCompany.fcf,
      sharesOutstanding: rawCompany.sharesOutstanding,
      netDebt: rawCompany.netDebt,
    });
  }
}

module.exports = {
  Company,
};
