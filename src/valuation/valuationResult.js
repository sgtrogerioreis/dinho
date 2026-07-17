class ValuationResult {
  constructor(data) {
    this.method = data.method;
    this.ticker = data.ticker;
    this.currentPrice = data.currentPrice;
    this.fairValue = data.fairValue;
    this.marginOfSafety = data.marginOfSafety;
    this.status = data.status;
    this.inputs = Object.freeze({ ...data.inputs });
    this.assumptions = Object.freeze({ ...data.assumptions });
    this.formula = data.formula;

    Object.freeze(this);
  }
}

module.exports = {
  ValuationResult,
};
