const { REQUIRED_COMPANY_NUMERIC_FIELDS } = require('../constants/companyFields');
const { ValidationError } = require('../errors/validationError');

function validateCompanyData(rawCompany) {
  if (!rawCompany || typeof rawCompany !== 'object') {
    throw new ValidationError('Invalid company payload.');
  }

  if (typeof rawCompany.ticker !== 'string' || rawCompany.ticker.trim() === '') {
    throw new ValidationError('Company ticker is required.');
  }

  if (typeof rawCompany.name !== 'string' || rawCompany.name.trim() === '') {
    throw new ValidationError('Company name is required.');
  }

  for (const field of REQUIRED_COMPANY_NUMERIC_FIELDS) {
    if (!Number.isFinite(rawCompany[field])) {
      throw new ValidationError(`Company field "${field}" must be a finite number.`);
    }
  }
}

module.exports = {
  validateCompanyData,
};
