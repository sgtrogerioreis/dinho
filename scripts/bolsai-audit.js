#!/usr/bin/env node

require('dotenv').config({ quiet: true });

const { runAudit } = require('../src/homologation/bolsai/auditRunner');

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const result = await runAudit(options);

  if (result.dryRun) {
    printEstimate(result.estimate);
    return;
  }

  printEstimate(result.estimate);
  console.log('');
  console.log(`Relatorios gerados para ${result.results.length} ticker(s).`);
}

function parseArgs(args) {
  const options = {};

  for (const arg of args) {
    if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--resume') {
      options.resume = true;
    } else if (arg === '--required-only') {
      options.requiredOnly = true;
    } else if (arg === '--ibov-only') {
      options.ibovOnly = true;
    } else if (arg === '--pilot') {
      options.pilot = true;
    } else if (arg === '--graham-only') {
      options.grahamOnly = true;
    } else if (arg.startsWith('--batch-size=')) {
      options.batchSize = Number(arg.split('=')[1]);
    } else if (arg.startsWith('--panel-used=')) {
      options.panelUsedToday = Number(arg.split('=')[1]);
    } else if (arg.startsWith('--ticker=')) {
      options.ticker = arg.split('=')[1];
    }
  }

  return options;
}

function printEstimate(estimate) {
  console.log('Homologacao BolsAI');
  console.log(`Tickers: ${estimate.tickers}`);
  if (estimate.grahamOnly) {
    console.log(`Modo Graham only: sim`);
    console.log(`Tickers concluidos pelo cache: ${estimate.cachedCompletedTickers}`);
    console.log(`Tickers pendentes: ${estimate.pendingTickers}`);
    console.log(`Painel BolsAI usado hoje: ${estimate.panelUsedToday}/${estimate.dailyLimit}`);
    console.log(`Margem de seguranca: ${estimate.safetyMargin}`);
    console.log(`Limite seguro para novas requisicoes: ${estimate.safeNewRequestLimit}`);
  }
  console.log(`Endpoints por ticker: ${estimate.endpointsPerTicker}`);
  console.log(`Requisicoes em cache: ${estimate.cachedRequests}`);
  console.log(`Estimativa de novas requisicoes: ${estimate.estimatedRequests}`);
  console.log(`Limite diario considerado: ${estimate.dailyLimit}`);
  console.log(`Cabe no limite diario: ${estimate.fitsDailyLimit ? 'sim' : 'nao'}`);
  console.log(`Tamanho do lote: ${estimate.batchSize}`);
  console.log(`Lotes planejados: ${estimate.plannedBatches}`);
  if (estimate.ibovSource) {
    console.log(`Fonte Ibovespa: ${estimate.ibovSource}`);
  }
  if (estimate.ibovReferenceDate) {
    console.log(`Referencia Ibovespa: ${estimate.ibovReferenceDate}`);
  }
}
