const fs = require('node:fs/promises');
const path = require('node:path');

const DEFAULT_CACHE_DIR = path.join(process.cwd(), '.tmp', 'bolsai-homologation');

class AuditStorage {
  constructor(options = {}) {
    this.cacheDir = options.cacheDir || DEFAULT_CACHE_DIR;
  }

  async ensure() {
    await fs.mkdir(this.cacheDir, { recursive: true });
  }

  payloadPath(ticker, key) {
    return path.join(this.cacheDir, 'payloads', ticker, `${key}.json`);
  }

  errorPath(ticker, key) {
    return path.join(this.cacheDir, 'errors', ticker, `${key}.json`);
  }

  async hasPayload(ticker, key) {
    try {
      await fs.access(this.payloadPath(ticker, key));
      return true;
    } catch {
      return false;
    }
  }

  async readPayload(ticker, key) {
    const content = await fs.readFile(this.payloadPath(ticker, key), 'utf8');
    return JSON.parse(content);
  }

  async writePayload(ticker, key, payload) {
    const filePath = this.payloadPath(ticker, key);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`);
  }

  async hasError(ticker, key) {
    try {
      await fs.access(this.errorPath(ticker, key));
      return true;
    } catch {
      return false;
    }
  }

  async readError(ticker, key) {
    const content = await fs.readFile(this.errorPath(ticker, key), 'utf8');
    return JSON.parse(content);
  }

  async writeError(ticker, key, error) {
    const filePath = this.errorPath(ticker, key);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, `${JSON.stringify(error, null, 2)}\n`);
  }
}

module.exports = {
  AuditStorage,
  DEFAULT_CACHE_DIR,
};
