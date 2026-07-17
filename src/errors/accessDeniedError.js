const { AppError } = require('./appError');

class AccessDeniedError extends AppError {
  constructor(message) {
    super(message, { code: 'ACCESS_DENIED_ERROR' });
  }
}

module.exports = {
  AccessDeniedError,
};
