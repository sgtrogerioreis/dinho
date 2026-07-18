class TtlCache {
  constructor(options = {}) {
    this.ttlMs = options.ttlMs || 5 * 60 * 1000;
    this.maxEntries = options.maxEntries || 128;
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
    this.deleteExpired();

    if (this.items.has(key)) {
      this.items.delete(key);
    }

    this.items.set(key, {
      value,
      expiresAt: this.clock.now() + this.ttlMs,
    });

    this.enforceMaxEntries();
  }

  deleteExpired() {
    const now = this.clock.now();

    for (const [key, item] of this.items.entries()) {
      if (item.expiresAt <= now) {
        this.items.delete(key);
      }
    }
  }

  enforceMaxEntries() {
    while (this.items.size > this.maxEntries) {
      const oldestKey = this.items.keys().next().value;
      this.items.delete(oldestKey);
    }
  }
}

module.exports = {
  TtlCache,
};
