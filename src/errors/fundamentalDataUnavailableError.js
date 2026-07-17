const { ValidationError } = require('./validationError');

class FundamentalDataUnavailableError extends ValidationError {
  constructor(message) {
    super(message);
    this.code = 'FUNDAMENTAL_DATA_UNAVAILABLE_ERROR';
  }
}

module.exports = {
  FundamentalDataUnavailableError,
};
