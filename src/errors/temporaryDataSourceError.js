const { DataSourceError } = require('./dataSourceError');

class TemporaryDataSourceError extends DataSourceError {
  constructor(message, options = {}) {
    super(message, options);
    this.code = 'TEMPORARY_DATA_SOURCE_ERROR';
  }
}

module.exports = {
  TemporaryDataSourceError,
};
