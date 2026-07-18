class AnalysisResult {
  constructor(options = {}) {
    this.method = options.method;
    this.ticker = options.ticker;
    this.companyName = options.companyName || null;
    this.currentPrice = options.currentPrice ?? null;
    this.fairPrice = options.fairPrice ?? null;
    this.marginOfSafety = options.marginOfSafety ?? null;
    this.status = options.status;
    this.referenceDate = options.referenceDate || null;
    this.provider = options.provider;
    this.inputs = Object.freeze({ ...(options.inputs || {}) });
    this.warnings = Object.freeze([...(options.warnings || [])]);
    this.metadata = Object.freeze({ ...(options.metadata || {}) });

    Object.freeze(this);
  }
}

module.exports = {
  AnalysisResult,
};
