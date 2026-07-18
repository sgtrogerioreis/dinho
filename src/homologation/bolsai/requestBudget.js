class RequestBudget {
  constructor(options = {}) {
    this.limit = options.limit || 200;
    this.safetyMargin = options.safetyMargin || 5;
    this.completed = options.completed || 0;
  }

  canConsume(amount = 1) {
    return this.completed + amount <= this.limit - this.safetyMargin;
  }

  consume(amount = 1) {
    if (!this.canConsume(amount)) {
      throw new Error('BolsAI homologation stopped before reaching the configured daily limit.');
    }

    this.completed += amount;
    return this.completed;
  }

  remainingSafe() {
    return Math.max(this.limit - this.safetyMargin - this.completed, 0);
  }
}

function estimateRequests(tickerCount, endpointCount, cachedCount = 0) {
  return Math.max(tickerCount * endpointCount - cachedCount, 0);
}

module.exports = {
  RequestBudget,
  estimateRequests,
};
