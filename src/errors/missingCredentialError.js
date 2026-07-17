const { ConfigurationError } = require('./configurationError');

class MissingCredentialError extends ConfigurationError {
  constructor(message) {
    super(message);
    this.code = 'MISSING_CREDENTIAL_ERROR';
  }
}

module.exports = {
  MissingCredentialError,
};
