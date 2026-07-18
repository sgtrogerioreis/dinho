const assert = require('node:assert/strict');
const { test } = require('node:test');
const { EventEmitter } = require('node:events');
const { Events } = require('discord.js');
const {
  logMemoryUsage,
  registerLifecycleDiagnostics,
  serializeRejection,
  toMb,
} = require('../../src/runtime/lifecycleDiagnostics');

test('toMb converts bytes to one decimal megabytes', () => {
  assert.equal(toMb(1024 * 1024), 1);
  assert.equal(toMb(1536 * 1024), 1.5);
});

test('serializeRejection keeps errors structured and non-errors compact', () => {
  assert.equal(serializeRejection(new Error('boom')).message, 'boom');
  assert.deepEqual(serializeRejection('plain failure'), {
    message: 'plain failure',
  });
});

test('logMemoryUsage logs compact memory fields in MB', () => {
  const messages = [];
  const logger = {
    log(message) {
      messages.push(message);
    },
  };

  logMemoryUsage(logger, 'test');

  assert.match(messages[0], /^\[memory\] test rss=\d+(\.\d)?MB heapUsed=/);
  assert.match(messages[0], /heapTotal=\d+(\.\d)?MB external=\d+(\.\d)?MB\.$/);
});

test('registerLifecycleDiagnostics logs Discord lifecycle events without secrets', () => {
  const client = new EventEmitter();
  const messages = [];
  const logger = {
    log(message) {
      messages.push(message);
    },
    warn(message) {
      messages.push(message);
    },
    error(message) {
      messages.push(message);
    },
  };

  const diagnostics = registerLifecycleDiagnostics(client, {
    logger,
    memoryIntervalMs: 60 * 60 * 1000,
  });

  client.emit(Events.ClientReady, {
    user: {
      tag: 'DINHO#0001',
    },
  });
  client.emit(Events.ShardDisconnect, null, 0);
  client.emit(Events.ShardReconnecting, 0);
  client.emit(Events.ShardResume, 0, 3);
  client.emit(Events.Error, new Error('socket failed'));

  diagnostics.stop();

  assert(messages.some((message) => message.startsWith('[runtime] PID=')));
  assert(messages.some((message) => message.startsWith('[memory] startup')));
  assert(messages.includes('[discord] Ready as DINHO#0001.'));
  assert(messages.includes('[discord] Shard disconnected. shardId=0.'));
  assert(messages.includes('[discord] Shard reconnecting. shardId=0.'));
  assert(messages.includes('[discord] Shard resumed. shardId=0 replayedEvents=3.'));
  assert(messages.includes('[discord] Client error.'));
});
