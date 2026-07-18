const test = require('node:test');
const assert = require('node:assert/strict');
const { GatewayIntentBits } = require('discord.js');

const { createDiscordClient } = require('../../src/discord/createClient');

test('createDiscordClient uses only the minimum guild intent for slash commands', () => {
  const client = createDiscordClient();

  assert.deepEqual(client.options.intents.toArray(), ['Guilds']);
  assert.equal(client.options.intents.has(GatewayIntentBits.Guilds), true);
  assert.deepEqual(client.options.partials, []);

  client.destroy();
});
