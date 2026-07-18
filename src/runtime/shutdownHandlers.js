function registerShutdownHandlers(client, options = {}) {
  const logger = options.logger || console;
  const runtimeProcess = options.process || process;
  let hasShutdownStarted = false;

  async function shutdown(signal) {
    if (hasShutdownStarted) {
      return;
    }

    hasShutdownStarted = true;

    if (signal === 'SIGTERM') {
      logger.log('[SHUTDOWN] Processo recebeu SIGTERM externo.');
    } else {
      logger.log(`[SHUTDOWN] Processo recebeu ${signal}.`);
    }

    try {
      client.destroy();
    } finally {
      runtimeProcess.exitCode = 0;
    }
  }

  runtimeProcess.once('SIGINT', () => {
    void shutdown('SIGINT');
  });

  runtimeProcess.once('SIGTERM', () => {
    void shutdown('SIGTERM');
  });

  return {
    shutdown,
  };
}

module.exports = {
  registerShutdownHandlers,
};
