function serializeError(error) {
  if (!(error instanceof Error)) {
    return {
      name: 'UnknownError',
      code: 'UNKNOWN_ERROR',
      message: 'Unknown error.',
    };
  }

  return {
    name: error.name,
    code: error.code || 'ERROR',
    message: error.message,
  };
}

module.exports = {
  serializeError,
};
