const { AppError } = require('./appError');

class DataSourceError extends AppError {
  constructor(message, options = {}) {
    super(message, { code: 'DATA_SOURCE_ERROR' });
    this.cause = options.cause;
  }
}

module.exports = {
  DataSourceError,
};
