const { AppError } = require('./appError');

class ConfigurationError extends AppError {
  constructor(message) {
    super(message, { code: 'CONFIGURATION_ERROR' });
  }
}

module.exports = {
  ConfigurationError,
};
