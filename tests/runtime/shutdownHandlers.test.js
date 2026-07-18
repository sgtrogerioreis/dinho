const assert = require('node:assert/strict');
const { test } = require('node:test');
const { EventEmitter } = require('node:events');
const { registerShutdownHandlers } = require('../../src/runtime/shutdownHandlers');

test('registerShutdownHandlers logs external SIGTERM and destroys the client once', async () => {
  const runtimeProcess = new EventEmitter();
  const messages = [];
  const client = {
    destroyCalls: 0,
    destroy() {
      this.destroyCalls += 1;
    },
  };

  registerShutdownHandlers(client, {
    logger: {
      log(message) {
        messages.push(message);
      },
    },
    process: runtimeProcess,
  });

  runtimeProcess.emit('SIGTERM');
  runtimeProcess.emit('SIGTERM');
  await Promise.resolve();

  assert.deepEqual(messages, ['[SHUTDOWN] Processo recebeu SIGTERM externo.']);
  assert.equal(client.destroyCalls, 1);
  assert.equal(runtimeProcess.exitCode, 0);
});

test('registerShutdownHandlers logs SIGINT without forcing process exit', async () => {
  const runtimeProcess = new EventEmitter();
  const messages = [];
  const client = {
    destroy() {},
  };

  registerShutdownHandlers(client, {
    logger: {
      log(message) {
        messages.push(message);
      },
    },
    process: runtimeProcess,
  });

  runtimeProcess.emit('SIGINT');
  await Promise.resolve();

  assert.deepEqual(messages, ['[SHUTDOWN] Processo recebeu SIGINT.']);
  assert.equal(runtimeProcess.exitCode, 0);
});
