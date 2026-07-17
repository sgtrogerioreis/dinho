const { AuthenticationError } = require('./authenticationError');

class InvalidCredentialError extends AuthenticationError {
  constructor(message) {
    super(message);
    this.code = 'INVALID_CREDENTIAL_ERROR';
  }
}

module.exports = {
  InvalidCredentialError,
};
