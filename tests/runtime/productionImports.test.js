const { execFileSync } = require('node:child_process');
const assert = require('node:assert/strict');
const test = require('node:test');

test('production command bootstrap does not load homologation, BRAPI or local providers', () => {
  const output = execFileSync(
    process.execPath,
    [
      '-e',
      [
        "const config = require('./src/config');",
        "const { createProductionCommandRegistry } = require('./src/runtime/productionCommandRegistry');",
        'createProductionCommandRegistry({',
        'appConfig: config.app,',
        'logger: console,',
        '});',
        "console.log(JSON.stringify(Object.keys(require.cache).filter((file) => file.includes('src'))));",
      ].join(''),
    ],
    {
      cwd: process.cwd(),
      encoding: 'utf8',
    },
  );
  const loadedFiles = JSON.parse(output);

  assert.equal(
    loadedFiles.some((file) => file.includes(`${pathPart('homologation')}`)),
    false,
  );
  assert.equal(
    loadedFiles.some((file) => file.includes(`${pathPart('providers')}brapi`)),
    false,
  );
  assert.equal(
    loadedFiles.some((file) => file.endsWith(`${pathPart('providers')}localProvider.js`)),
    false,
  );
  assert.equal(
    loadedFiles.some((file) => file.endsWith(`${pathPart('services')}calculateGrahamValuation.js`)),
    false,
  );
  assert.equal(
    loadedFiles.some((file) => file.endsWith(`${pathPart('commands')}graham.js`)),
    false,
  );
  assert.equal(
    loadedFiles.some((file) =>
      file.endsWith(`${pathPart('discord')}renderers${pathPart('')}analysisEmbedRenderer.js`),
    ),
    false,
  );
  assert.equal(
    loadedFiles.some((file) =>
      file.endsWith(`${pathPart('providers')}bolsai${pathPart('')}grahamProvider.js`),
    ),
    false,
  );
});

function pathPart(name) {
  return `${name}${require('node:path').sep}`;
}
