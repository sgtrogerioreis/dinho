const test = require('node:test');
const assert = require('node:assert/strict');

const { createGrahamCommand, grahamCommandData } = require('../../src/commands/graham');

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

test('graham command reads the ticker, calls the service once and returns the formatted response', async () => {
  const calls = [];
  const provider = {
    async getCompanyByTicker() {
      return null;
    },
  };
  const valuationResult = { method: 'GRAHAM' };
  const formattedResponse = { content: 'formatted' };
  const command = createGrahamCommand({
    calculateGrahamValuationByTicker: async (ticker, receivedProvider) => {
      calls.push({ ticker, receivedProvider });
      return valuationResult;
    },
    companyProvider: provider,
    formatGrahamResponse: (result) => {
      calls.push({ formattedResult: result });
      return formattedResponse;
    },
  });

  const interaction = createFakeInteraction('PETR4');
  const response = await command.execute(interaction);

  assert.deepEqual(calls, [
    {
      ticker: 'PETR4',
      receivedProvider: provider,
    },
    {
      formattedResult: valuationResult,
    },
  ]);
  assert.equal(response, formattedResponse);
});

function createFakeInteraction(ticker) {
  return {
    options: {
      getString(optionName, isRequired) {
        assert.equal(optionName, 'ticker');
        assert.equal(isRequired, true);
        return ticker;
      },
    },
  };
}
