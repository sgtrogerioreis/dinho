require('dotenv').config({ quiet: true });

const SAMPLE_INTERVAL_MS = 250;
const STABILIZATION_MS = Number(process.env.MEMORY_MEASURE_STABILIZATION_MS || 8000);

async function measureRuntimeMemory() {
  const samples = [];
  const sampleTimer = setInterval(() => {
    samples.push(readMemory());
  }, SAMPLE_INTERVAL_MS);

  if (typeof sampleTimer.unref === 'function') {
    sampleTimer.unref();
  }

  const stages = [];
  recordStage(stages, 'before-imports');

  const config = require('../src/config');
  recordStage(stages, 'after-config');

  const { createDiscordClient } = require('../src/discord/createClient');
  const { Events } = require('discord.js');
  const client = createDiscordClient();
  recordStage(stages, 'after-discord-client');

  const { createProductionCommandRegistry } = require('../src/runtime/productionCommandRegistry');
  const commandRegistry = createProductionCommandRegistry({
    appConfig: config.app,
    logger: quietLogger,
  });
  recordStage(stages, 'after-commands');

  const discordConfig = config.discord.getDiscordRuntimeConfig();

  try {
    await waitForReady(client, discordConfig.token, Events);
    recordStage(stages, 'after-ready');

    await wait(STABILIZATION_MS);
    recordStage(stages, 'stabilized');

    const allMemoryPoints = [...samples, ...stages.map((stage) => stage.memory)];
    const peak = calculatePeak(allMemoryPoints);

    console.log(
      JSON.stringify(
        {
          stages,
          peak,
          commands: commandRegistry.size,
        },
        null,
        2,
      ),
    );
  } finally {
    clearInterval(sampleTimer);
    client.destroy();
  }
}

function waitForReady(client, token, events) {
  return new Promise((resolve, reject) => {
    client.once(events.ClientReady, () => {
      resolve();
    });
    client.once(events.Error, reject);
    client.login(token).catch(reject);
  });
}

function recordStage(stages, label) {
  if (global.gc) {
    global.gc();
  }

  stages.push({
    label,
    memory: readMemory(),
  });
}

function readMemory() {
  const usage = process.memoryUsage();

  return {
    rssMb: toMb(usage.rss),
    heapUsedMb: toMb(usage.heapUsed),
    heapTotalMb: toMb(usage.heapTotal),
    externalMb: toMb(usage.external),
  };
}

function calculatePeak(points) {
  return points.reduce(
    (peak, point) => ({
      rssMb: Math.max(peak.rssMb, point.rssMb),
      heapUsedMb: Math.max(peak.heapUsedMb, point.heapUsedMb),
      heapTotalMb: Math.max(peak.heapTotalMb, point.heapTotalMb),
      externalMb: Math.max(peak.externalMb, point.externalMb),
    }),
    {
      rssMb: 0,
      heapUsedMb: 0,
      heapTotalMb: 0,
      externalMb: 0,
    },
  );
}

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function toMb(value) {
  return Math.round((value / 1024 / 1024) * 10) / 10;
}

const quietLogger = Object.freeze({
  debug() {},
  error() {},
  info() {},
  log() {},
  warn() {},
});

measureRuntimeMemory().catch((error) => {
  console.error('Failed to measure runtime memory.', {
    name: error.name,
    message: error.message,
  });
  process.exitCode = 1;
});
