class TtlCache {
  constructor(options = {}) {
    this.ttlMs = options.ttlMs || 5 * 60 * 1000;
    this.clock = options.clock || Date;
    this.items = new Map();
  }

  get(key) {
    const item = this.items.get(key);

    if (!item) {
      return null;
    }

    if (item.expiresAt <= this.clock.now()) {
      this.items.delete(key);
      return null;
    }

    return item.value;
  }

  set(key, value) {
    this.items.set(key, {
      value,
      expiresAt: this.clock.now() + this.ttlMs,
    });
  }
}

module.exports = {
  TtlCache,
};
