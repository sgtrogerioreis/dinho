const test = require('node:test');
const assert = require('node:assert/strict');

const { PermissionDeniedError } = require('../../src/errors/permissionDeniedError');
const { createGrahamCommand } = require('../../src/commands/graham');
const { grahamCommandData } = require('../../src/commands/grahamDefinition');

test('graham command definition has the correct name, description and ticker option', () => {
  const payload = grahamCommandData.toJSON();

  assert.equal(payload.name, 'graham');
  assert.equal(payload.description, 'Calcula o preço justo de uma ação pelo método de Graham.');
  assert.equal(payload.options.length, 1);
  assert.equal(payload.options[0].name, 'ticker');
  assert.equal(payload.options[0].description, 'Ticker da ação brasileira, como PETR4.');
  assert.equal(payload.options[0].required, true);
  assert.equal(payload.options[0].type, 3);
});

test('graham command checks permission, calls analysis service and renders the result', async () => {
  const calls = [];
  const analysisResult = { method: 'GRAHAM', ticker: 'PETR4', status: 'UNDERVALUED', metadata: {} };
  const rendered = { embeds: ['embed'] };
  const provider = {
    async getGrahamInputsByTicker() {},
  };
  const command = createGrahamCommand({
    analyzeGrahamByTicker: async (ticker, receivedProvider) => {
      calls.push({ ticker, receivedProvider });
      return analysisResult;
    },
    grahamProvider: provider,
    analysisRenderer: {
      render(result) {
        calls.push({ renderedResult: result });
        return rendered;
      },
    },
    permissionGuard: {
      canRunAnalysis() {
        calls.push({ permissionChecked: true });
        return true;
      },
    },
    logger: {
      info(message, details) {
        calls.push({ logMessage: message, logDetails: details });
      },
    },
  });

  const response = await command.execute(createFakeInteraction('petr4'));

  assert.equal(response, rendered);
  assert.deepEqual(calls.slice(0, 2), [
    { permissionChecked: true },
    { ticker: 'petr4', receivedProvider: provider },
  ]);
  assert.equal(calls[2].logDetails.ticker, 'PETR4');
  assert.equal(calls[2].logDetails.result, 'UNDERVALUED');
  assert.deepEqual(calls[3], { renderedResult: analysisResult });
});

test('graham command rejects users without permission', async () => {
  const command = createGrahamCommand({
    analyzeGrahamByTicker: async () => {
      throw new Error('should not run');
    },
    grahamProvider: {
      async getGrahamInputsByTicker() {},
    },
    analysisRenderer: {
      render() {
        return {};
      },
    },
    permissionGuard: {
      canRunAnalysis() {
        return false;
      },
    },
    logger: { info() {} },
  });

  await assert.rejects(
    () => command.execute(createFakeInteraction('PETR4')),
    PermissionDeniedError,
  );
});

function createFakeInteraction(ticker) {
  return {
    user: { id: 'user-1' },
    options: {
      getString(optionName, isRequired) {
        assert.equal(optionName, 'ticker');
        assert.equal(isRequired, true);
        return ticker;
      },
    },
  };
}
