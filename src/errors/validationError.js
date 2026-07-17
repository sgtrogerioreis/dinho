const { AppError } = require('./appError');

class ValidationError extends AppError {
  constructor(message) {
    super(message, { code: 'VALIDATION_ERROR' });
  }
}

module.exports = {
  ValidationError,
};
