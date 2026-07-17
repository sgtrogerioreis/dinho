const { AppError } = require('./appError');

class NotFoundError extends AppError {
  constructor(message) {
    super(message, { code: 'NOT_FOUND' });
  }
}

module.exports = {
  NotFoundError,
};
