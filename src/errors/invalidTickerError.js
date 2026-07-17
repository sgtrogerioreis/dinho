const { ValidationError } = require('./validationError');

class InvalidTickerError extends ValidationError {
  constructor(message) {
    super(message);
    this.code = 'INVALID_TICKER';
  }
}

module.exports = {
  InvalidTickerError,
};
