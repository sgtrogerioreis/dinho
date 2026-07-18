const test = require('node:test');
const assert = require('node:assert/strict');

const { AccessDeniedError } = require('../../src/errors/accessDeniedError');
const { ConfigurationError } = require('../../src/errors/configurationError');
const { InvalidTickerError } = require('../../src/errors/invalidTickerError');
const { NotFoundError } = require('../../src/errors/notFoundError');
const { RateLimitError } = require('../../src/errors/rateLimitError');
const { createInteractionHandler } = require('../../src/discord/handleInteraction');

test('interaction handler reads the command and replies with the formatted result', async () => {
  const commandRegistry = new Map([
    [
      'graham',
      {
        async execute(interaction) {
          return {
            content: `Ticker recebido: ${interaction.options.getString('ticker')}`,
          };
        },
      },
    ],
  ]);
  const interaction = createFakeInteraction();
  const handleInteraction = createInteractionHandler(commandRegistry);

  await handleInteraction(interaction);

  assert.equal(interaction.replyCalls.length, 1);
  assert.equal(interaction.replyCalls[0].content, 'Ticker recebido: PETR4');
});

test('interaction handler maps ticker not found errors to a friendly message', async () => {
  const interaction = createFakeInteraction();
  const handleInteraction = createInteractionHandler(
    new Map([
      [
        'graham',
        {
          async execute() {
            throw new NotFoundError('missing');
          },
        },
      ],
    ]),
  );

  await handleInteraction(interaction);

  assert.equal(interaction.replyCalls[0].content, 'Nao encontrei dados para o ticker informado.');
});

test('interaction handler maps invalid ticker errors to a friendly message', async () => {
  const interaction = createFakeInteraction();
  const handleInteraction = createInteractionHandler(
    new Map([
      [
        'graham',
        {
          async execute() {
            throw new InvalidTickerError('invalid');
          },
        },
      ],
    ]),
  );

  await handleInteraction(interaction);

  assert.equal(interaction.replyCalls[0].content, 'Ticker inválido.');
});

test('interaction handler maps temporary API failures to a private message', async () => {
  const interaction = createFakeInteraction();
  const handleInteraction = createInteractionHandler(
    new Map([
      [
        'graham',
        {
          async execute() {
            throw new RateLimitError('busy');
          },
        },
      ],
    ]),
  );

  await handleInteraction(interaction);

  assert.equal(
    interaction.replyCalls[0].content,
    'A fonte de dados atingiu o limite de consultas. Tente novamente mais tarde.',
  );
  assert.equal(interaction.replyCalls[0].flags, 64);
});

test('interaction handler maps access denied errors to a friendly private message', async () => {
  const interaction = createFakeInteraction();
  const handleInteraction = createInteractionHandler(
    new Map([
      [
        'graham',
        {
          async execute() {
            throw new AccessDeniedError('blocked');
          },
        },
      ],
    ]),
  );

  await handleInteraction(interaction);

  assert.equal(
    interaction.replyCalls[0].content,
    'Nao foi possivel acessar os dados deste ativo na fonte atual.',
  );
  assert.equal(interaction.replyCalls[0].flags, 64);
});

test('interaction handler maps unexpected errors without exposing technical details', async () => {
  const interaction = createFakeInteraction();
  const handleInteraction = createInteractionHandler(
    new Map([
      [
        'graham',
        {
          async execute() {
            throw new Error('boom');
          },
        },
      ],
    ]),
  );

  await handleInteraction(interaction);

  assert.equal(interaction.replyCalls[0].content, 'Nao foi possivel concluir a analise agora.');
});

test('interaction handler maps configuration errors to a private message', async () => {
  const interaction = createFakeInteraction();
  const handleInteraction = createInteractionHandler(
    new Map([
      [
        'graham',
        {
          async execute() {
            throw new ConfigurationError('bad config');
          },
        },
      ],
    ]),
  );

  await handleInteraction(interaction);

  assert.equal(
    interaction.replyCalls[0].content,
    'O provedor de dados nao esta disponivel corretamente no momento.',
  );
  assert.equal(interaction.replyCalls[0].flags, 64);
});

test('interaction handler does not respond twice when the interaction was already replied', async () => {
  const interaction = createFakeInteraction({
    replied: true,
  });
  const handleInteraction = createInteractionHandler(
    new Map([
      [
        'graham',
        {
          async execute() {
            throw new Error('boom');
          },
        },
      ],
    ]),
  );

  await handleInteraction(interaction);

  assert.equal(interaction.replyCalls.length, 0);
  assert.equal(interaction.followUpCalls.length, 1);
});

function createFakeInteraction(overrides = {}) {
  return {
    commandName: 'graham',
    deferred: false,
    replied: false,
    replyCalls: [],
    followUpCalls: [],
    isChatInputCommand() {
      return true;
    },
    options: {
      getString(optionName) {
        assert.equal(optionName, 'ticker');
        return 'PETR4';
      },
    },
    async reply(payload) {
      this.replyCalls.push(payload);
      this.replied = true;
      return payload;
    },
    async followUp(payload) {
      this.followUpCalls.push(payload);
      return payload;
    },
    ...overrides,
  };
}
