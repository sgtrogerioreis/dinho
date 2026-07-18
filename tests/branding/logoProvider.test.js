const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const {
  LogoProvider,
  NullLogoProvider,
  normalizeLogoTicker,
} = require('../../src/branding/logoProvider');

test('LogoProvider returns an attachment for an existing ticker logo', () => {
  const logosDirectory = createTempLogosDirectory();
  fs.writeFileSync(path.join(logosDirectory, 'PETR4.png'), Buffer.from([0x89, 0x50, 0x4e, 0x47]));

  const attachment = new LogoProvider({ logosDirectory }).getAttachment('petr4');

  assert.equal(attachment.name, 'PETR4.png');
  assert.match(attachment.attachment, /PETR4\.png$/);
  assert.equal(path.isAbsolute(attachment.attachment), false);
});

test('LogoProvider returns null when a logo does not exist', () => {
  const logosDirectory = createTempLogosDirectory();

  assert.equal(new LogoProvider({ logosDirectory }).getAttachment('VALE3'), null);
});

test('LogoProvider returns null for an invalid ticker', () => {
  const logosDirectory = createTempLogosDirectory();

  assert.equal(new LogoProvider({ logosDirectory }).getAttachment('PETROBRAS'), null);
  assert.equal(normalizeLogoTicker(''), null);
});

test('NullLogoProvider always returns null', () => {
  assert.equal(new NullLogoProvider().getAttachment('PETR4'), null);
});

function createTempLogosDirectory() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'dinho-logos-'));
}
