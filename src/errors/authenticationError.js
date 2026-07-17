const { AppError } = require('./appError');

class AuthenticationError extends AppError {
  constructor(message) {
    super(message, { code: 'AUTHENTICATION_ERROR' });
  }
}

module.exports = {
  AuthenticationError,
};
