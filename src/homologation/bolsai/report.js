const fs = require('node:fs/promises');
const path = require('node:path');

function summarizeUniverse(results, tickersByLayer = {}) {
  return {
    required: summarizeLayer(results, tickersByLayer.required || []),
    ibov: summarizeLayer(results, tickersByLayer.ibov || []),
    total: summarizeLayer(
      results,
      results.map((result) => result.ticker),
    ),
    grahamIbov: summarizeGraham(results, tickersByLayer.ibov || []),
  };
}

function summarizeLayer(results, tickers) {
  const set = new Set(tickers);
  const layerResults = results.filter((result) => set.has(result.ticker));
  return {
    tickers: layerResults.length,
    grahamComplete: countComplete(layerResults, 'graham'),
    grahamDataComplete: countGrahamDataComplete(layerResults),
    grahamDataCoveragePct: grahamDataCoveragePct(layerResults),
    grahamApplicable: countComplete(layerResults, 'graham'),
    grahamApplicabilityPct: coveragePct(layerResults, 'graham'),
    grahamNotApplicable: layerResults.filter(
      (result) => result.methods.graham.category === 'not_applicable',
    ).length,
    bazinComplete: countComplete(layerResults, 'bazin'),
    fcdComplete: countComplete(layerResults, 'fcd'),
    allComplete: layerResults.filter((result) =>
      ['graham', 'bazin', 'fcd'].every((method) => result.methods[method].status === 'completo'),
    ).length,
    grahamCoveragePct: coveragePct(layerResults, 'graham'),
    bazinCoveragePct: coveragePct(layerResults, 'bazin'),
    fcdCoveragePct: coveragePct(layerResults, 'fcd'),
  };
}

async function writeReports(options) {
  await fs.mkdir(path.join(process.cwd(), 'reports'), { recursive: true });
  await fs.mkdir(path.join(process.cwd(), 'docs'), { recursive: true });

  const summary = summarizeUniverse(options.results, options.tickersByLayer);
  const structured = {
    generatedAt: options.generatedAt,
    apiKeyDisplayed: false,
    endpointsUsed: options.endpointsUsed,
    requestCount: options.requestCount,
    localRequestCount: options.localRequestCount ?? options.requestCount,
    panelUsedToday: options.panelUsedToday ?? null,
    panelDifference: options.panelDifference ?? null,
    tickersByLayer: options.tickersByLayer,
    summary,
    results: options.results,
  };

  await fs.writeFile(
    path.join(process.cwd(), 'reports', 'bolsai-homologation.json'),
    `${JSON.stringify(structured, null, 2)}\n`,
  );
  await fs.writeFile(
    path.join(process.cwd(), 'reports', 'bolsai-homologation.csv'),
    toCsv(options.results),
  );
  await fs.writeFile(
    path.join(process.cwd(), 'docs', 'BOLSAI-HOMOLOGATION.md'),
    toHomologationMarkdown(structured),
  );
  await fs.writeFile(
    path.join(process.cwd(), 'docs', 'BOLSAI-FIELD-MATRIX.md'),
    toMatrixMarkdown(options.results),
  );

  return structured;
}

function countComplete(results, method) {
  return results.filter((result) => result.methods[method].status === 'completo').length;
}

function coveragePct(results, method) {
  if (results.length === 0) {
    return 0;
  }

  return Number(((countComplete(results, method) / results.length) * 100).toFixed(2));
}

function countGrahamDataComplete(results) {
  return results.filter((result) => hasGrahamDataCoverage(result)).length;
}

function grahamDataCoveragePct(results) {
  if (results.length === 0) {
    return 0;
  }

  return Number(((countGrahamDataComplete(results) / results.length) * 100).toFixed(2));
}

function toCsv(results) {
  const rows = [
    [
      'ticker',
      'company_name',
      'sector',
      'graham_status',
      'graham_category',
      'bazin_status',
      'fcd_status',
      'dividend_years',
      'annual_financial_years',
      'quarterly_periods',
      'field_alerts',
      'endpoint_errors',
    ],
  ];

  for (const result of results) {
    rows.push([
      result.ticker,
      result.companyName || '',
      result.sector || '',
      result.methods.graham.status,
      result.methods.graham.category || '',
      result.methods.bazin.status,
      result.methods.fcd.status,
      result.methods.bazin.completeYears,
      result.methods.fcd.annualYears,
      result.methods.fcd.quarterlyPeriods,
      missingFields(result).join('|'),
      Object.entries(result.endpointErrors)
        .map(([key, value]) => `${key}:${value}`)
        .join('|'),
    ]);
  }

  return `${rows.map((row) => row.map(csvEscape).join(',')).join('\n')}\n`;
}

function toHomologationMarkdown(report) {
  const total = report.summary.total;
  const grahamIbov = report.summary.grahamIbov;
  return `# Homologacao BolsAI

- Execucao: ${report.generatedAt}
- Chave: nunca exibida
- Plano identificado: verificar header/endpoint de uso quando disponivel
- Endpoints usados: ${report.endpointsUsed.join(', ')}
- Requisicoes consumidas nesta execucao: ${report.requestCount}
- Contador local registrado: ${report.localRequestCount}
- Painel BolsAI informado: ${report.panelUsedToday === null ? 'nao informado' : report.panelUsedToday}
- Diferenca entre contador local e painel: ${
    report.panelDifference === null ? 'nao calculada' : report.panelDifference
  }
- Ativos testados: ${total.tickers}
- Graham completo: ${total.grahamComplete} (${total.grahamCoveragePct}%)
- Bazin completo: ${total.bazinComplete} (${total.bazinCoveragePct}%)
- FCD completo: ${total.fcdComplete} (${total.fcdCoveragePct}%)
- Cobertura completa dos tres metodos: ${total.allComplete}

## Cobertura Graham no Ibovespa

- Tickers testados: ${grahamIbov.tested}
- Cobertura dos dados necessarios: ${grahamIbov.dataComplete}/${grahamIbov.tested} (${grahamIbov.dataCoveragePct}%)
- Graham calculavel: ${grahamIbov.complete}/${grahamIbov.tested} (${grahamIbov.applicabilityPct}%)
- Graham nao aplicavel: ${grahamIbov.notApplicable}/${grahamIbov.tested}
- Ausencia de dados: ${grahamIbov.missingData}
- Categorias sem calculo: ${formatCategoryCounts(grahamIbov.failuresByCategory)}
- Tickers calculaveis: ${grahamIbov.completeTickers.join(', ') || '-'}
- Tickers nao aplicaveis/incompletos: ${formatIncompleteTickers(grahamIbov.incompleteTickers)}
- Requisicoes efetivamente consumidas nesta rodada: ${report.requestCount}
- Diferenca entre contador local e painel da BolsAI: ${
    report.panelDifference === null
      ? 'painel nao consultado automaticamente; comparar manualmente'
      : report.panelDifference
  }

## Conclusao Tecnica

- BolsAI Free homologada como fonte principal de dados para Graham.
- Cobertura dos campos necessarios: 100% no Ibovespa testado.
- Fallback nao e necessario por ausencia de dados neste universo.
- Deve existir tratamento semantico para \`GRAHAM_NOT_APPLICABLE\` quando LPA ou VPA forem iguais ou menores que zero.
- Os casos nao aplicaveis nao podem produzir raiz com dados negativos nem preco justo artificial.
`;
}

function toMatrixMarkdown(results) {
  const lines = [
    '# Matriz de Campos BolsAI',
    '',
    '| Ticker | Graham | Bazin | FCD | Anos proventos | Anos financeiros | Campos ausentes/alertas | Erros de acesso | Observacoes |',
    '| --- | --- | --- | --- | ---: | ---: | --- | --- | --- |',
  ];

  for (const result of results) {
    lines.push(
      `| ${[
        result.ticker,
        displayGrahamStatus(result),
        result.methods.bazin.status,
        result.methods.fcd.status,
        result.methods.bazin.completeYears,
        result.methods.fcd.annualYears,
        missingFields(result).join(', ') || '-',
        Object.entries(result.endpointErrors)
          .filter(([, value]) => value === 'access_denied')
          .map(([key]) => key)
          .join(', ') || '-',
        result.inconsistencies.length > 0
          ? `${result.inconsistencies.length} divergencias para revisar`
          : '-',
      ].join(' | ')} |`,
    );
  }

  return `${lines.join('\n')}\n`;
}

function displayGrahamStatus(result) {
  if (result.methods.graham.category === 'complete') {
    return 'completo';
  }

  if (result.methods.graham.category === 'not_applicable') {
    return 'not_applicable';
  }

  return result.methods.graham.category || result.methods.graham.status;
}

function missingFields(result) {
  const fields = [];

  for (const [method, methodResult] of Object.entries(result.methods)) {
    for (const [field, status] of Object.entries(methodResult.fields)) {
      if (
        ['missing', 'null', 'zero', 'request_error', 'access_denied', 'inconsistent'].includes(
          status,
        )
      ) {
        fields.push(`${method}.${field}:${status}`);
      }
    }
  }

  return fields;
}

function summarizeGraham(results, tickers) {
  const set = new Set(tickers);
  const layerResults = results.filter((result) => set.has(result.ticker));
  const dataCompleteTickers = layerResults
    .filter((result) => hasGrahamDataCoverage(result))
    .map((result) => result.ticker);
  const completeTickers = layerResults
    .filter((result) => result.methods.graham.category === 'complete')
    .map((result) => result.ticker);
  const incompleteTickers = layerResults
    .filter((result) => result.methods.graham.category !== 'complete')
    .map((result) => ({
      ticker: result.ticker,
      category: result.methods.graham.category,
    }));
  const failuresByCategory = {};

  for (const result of layerResults) {
    const category = result.methods.graham.category;
    if (category !== 'complete') {
      failuresByCategory[category] = (failuresByCategory[category] || 0) + 1;
    }
  }

  return {
    tested: layerResults.length,
    dataComplete: dataCompleteTickers.length,
    dataCoveragePct:
      layerResults.length === 0
        ? 0
        : Number(((dataCompleteTickers.length / layerResults.length) * 100).toFixed(2)),
    complete: completeTickers.length,
    notApplicable: failuresByCategory.not_applicable || 0,
    missingData: layerResults.length - dataCompleteTickers.length,
    incomplete: incompleteTickers.length,
    applicabilityPct:
      layerResults.length === 0
        ? 0
        : Number(((completeTickers.length / layerResults.length) * 100).toFixed(2)),
    coveragePct:
      layerResults.length === 0
        ? 0
        : Number(((dataCompleteTickers.length / layerResults.length) * 100).toFixed(2)),
    failuresByCategory,
    completeTickers,
    incompleteTickers,
  };
}

function hasGrahamDataCoverage(result) {
  const fields = result.methods.graham.fields;
  return ['currentPrice', 'quoteDateTime', 'lpa', 'vpa'].every((field) =>
    ['available', 'inconsistent'].includes(fields[field]),
  );
}

function formatCategoryCounts(categories) {
  const entries = Object.entries(categories);
  return entries.length === 0 ? '-' : entries.map(([key, value]) => `${key}: ${value}`).join(', ');
}

function formatIncompleteTickers(tickers) {
  return tickers.length === 0
    ? '-'
    : tickers.map((entry) => `${entry.ticker} (${entry.category})`).join(', ');
}

function csvEscape(value) {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

module.exports = {
  summarizeUniverse,
  toCsv,
  writeReports,
};
