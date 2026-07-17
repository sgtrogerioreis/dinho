const { AppError } = require('./appError');

class RateLimitError extends AppError {
  constructor(message) {
    super(message, { code: 'RATE_LIMIT_ERROR' });
  }
}

module.exports = {
  RateLimitError,
};
