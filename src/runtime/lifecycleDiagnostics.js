const { Events } = require('discord.js');
const { serializeError } = require('../utils/errorDetails');

const MEMORY_LOG_INTERVAL_MS = 5 * 60 * 1000;

function registerLifecycleDiagnostics(client, options = {}) {
  const logger = options.logger || console;
  const memoryIntervalMs = options.memoryIntervalMs || MEMORY_LOG_INTERVAL_MS;

  logProcessStart(logger);
  logMemoryUsage(logger, 'startup');
  registerClientDiagnostics(client, logger);
  registerProcessDiagnostics(logger);

  const memoryInterval = setInterval(() => {
    logMemoryUsage(logger, 'periodic');
  }, memoryIntervalMs);

  if (typeof memoryInterval.unref === 'function') {
    memoryInterval.unref();
  }

  return {
    stop() {
      clearInterval(memoryInterval);
    },
  };
}

function logProcessStart(logger) {
  logger.log(`[runtime] PID=${process.pid} Node=${process.version}.`);
}

function registerClientDiagnostics(client, logger) {
  client.once(Events.ClientReady, (readyClient) => {
    const tag = readyClient.user?.tag || readyClient.user?.id || 'unknown';
    logger.log(`[discord] Ready as ${tag}.`);
  });

  client.on(Events.ShardDisconnect, (_event, shardId) => {
    logger.warn(`[discord] Shard disconnected. shardId=${formatShardId(shardId)}.`);
  });

  client.on(Events.ShardReconnecting, (shardId) => {
    logger.warn(`[discord] Shard reconnecting. shardId=${formatShardId(shardId)}.`);
  });

  client.on(Events.ShardResume, (shardId, replayedEvents) => {
    logger.log(
      `[discord] Shard resumed. shardId=${formatShardId(shardId)} replayedEvents=${replayedEvents}.`,
    );
  });

  client.on(Events.Error, (error) => {
    logger.error('[discord] Client error.', serializeError(error));
  });
}

function registerProcessDiagnostics(logger) {
  process.on('beforeExit', (code) => {
    logger.log(`[runtime] beforeExit code=${code}.`);
  });

  process.on('exit', (code) => {
    logger.log(`[runtime] exit code=${code}.`);
  });

  process.on('uncaughtException', (error) => {
    logger.error('[runtime] uncaughtException.', serializeError(error));
    process.exitCode = 1;
  });

  process.on('unhandledRejection', (reason) => {
    logger.error('[runtime] unhandledRejection.', serializeRejection(reason));
    process.exitCode = 1;
  });
}

function logMemoryUsage(logger, label) {
  const usage = process.memoryUsage();

  logger.log(
    `[memory] ${label} rss=${toMb(usage.rss)}MB heapUsed=${toMb(usage.heapUsed)}MB heapTotal=${toMb(
      usage.heapTotal,
    )}MB external=${toMb(usage.external)}MB.`,
  );
}

function serializeRejection(reason) {
  if (reason instanceof Error) {
    return serializeError(reason);
  }

  return {
    message: String(reason),
  };
}

function toMb(value) {
  return Math.round((value / 1024 / 1024) * 10) / 10;
}

function formatShardId(shardId) {
  return shardId === undefined || shardId === null ? 'unknown' : shardId;
}

module.exports = {
  MEMORY_LOG_INTERVAL_MS,
  logMemoryUsage,
  registerLifecycleDiagnostics,
  serializeRejection,
  toMb,
};
