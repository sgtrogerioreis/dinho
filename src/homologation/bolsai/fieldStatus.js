const FIELD_STATUS = {
  ACCESS_DENIED: 'access_denied',
  AVAILABLE: 'available',
  INCONSISTENT: 'inconsistent',
  MISSING: 'missing',
  NOT_APPLICABLE: 'not_applicable',
  NULL: 'null',
  REQUEST_ERROR: 'request_error',
  ZERO: 'zero',
};

function classifyValue(value) {
  if (value === undefined) {
    return FIELD_STATUS.MISSING;
  }

  if (value === null) {
    return FIELD_STATUS.NULL;
  }

  if (typeof value === 'number' && value === 0) {
    return FIELD_STATUS.ZERO;
  }

  return FIELD_STATUS.AVAILABLE;
}

function methodCoverage(requiredStatuses) {
  const values = Object.values(requiredStatuses);

  if (values.length === 0 || values.every((status) => status === FIELD_STATUS.ACCESS_DENIED)) {
    return 'indisponivel';
  }

  if (values.every((status) => status === FIELD_STATUS.AVAILABLE)) {
    return 'completo';
  }

  return 'parcial';
}

module.exports = {
  FIELD_STATUS,
  classifyValue,
  methodCoverage,
};
