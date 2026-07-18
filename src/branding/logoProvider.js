const fs = require('node:fs');
const path = require('node:path');
const { AttachmentBuilder } = require('discord.js');
const { normalizeTicker } = require('../utils/ticker');

const LOGOS_DIRECTORY = path.join(__dirname, '..', 'assets', 'logos');

class LogoProvider {
  constructor(options = {}) {
    this.logosDirectory = options.logosDirectory || LOGOS_DIRECTORY;
  }

  getAttachment(ticker) {
    const normalizedTicker = normalizeLogoTicker(ticker);

    if (!normalizedTicker) {
      return null;
    }

    const fileName = `${normalizedTicker}.png`;
    const absolutePath = path.join(this.logosDirectory, fileName);

    if (!fs.existsSync(absolutePath)) {
      return null;
    }

    return new AttachmentBuilder(toRelativePath(absolutePath), {
      name: fileName,
    });
  }
}

class NullLogoProvider {
  getAttachment() {
    return null;
  }
}

function normalizeLogoTicker(ticker) {
  try {
    return normalizeTicker(ticker);
  } catch {
    return null;
  }
}

function toRelativePath(filePath) {
  return path.relative(process.cwd(), filePath).replaceAll(path.sep, '/');
}

module.exports = {
  LOGOS_DIRECTORY,
  LogoProvider,
  NullLogoProvider,
  normalizeLogoTicker,
};
