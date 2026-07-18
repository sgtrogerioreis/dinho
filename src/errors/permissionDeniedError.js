const { AppError } = require('./appError');

class PermissionDeniedError extends AppError {
  constructor(message) {
    super(message, { code: 'PERMISSION_DENIED' });
  }
}

module.exports = {
  PermissionDeniedError,
};
