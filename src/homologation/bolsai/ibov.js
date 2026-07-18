const fs = require('node:fs/promises');
const path = require('node:path');
const axios = require('axios');

const B3_PORTFOLIO_URL =
  'https://sistemaswebb3-listados.b3.com.br/indexProxy/indexCall/GetPortfolioDay';

function buildB3PortfolioUrl() {
  const payload = {
    language: 'pt-br',
    pageNumber: 1,
    pageSize: 120,
    index: 'IBOV',
    segment: '1',
  };
  return `${B3_PORTFOLIO_URL}/${Buffer.from(JSON.stringify(payload)).toString('base64')}`;
}

async function fetchIbovFromB3(httpClient = axios) {
  const response = await httpClient.get(buildB3PortfolioUrl());
  const data = response.data || {};
  const rows = data.results || data.data || data.portfolio || [];

  return {
    source: 'B3',
    sourceUrl:
      'https://www.b3.com.br/pt_br/market-data-e-indices/indices/indices-amplos/indice-ibovespa-ibovespa-composicao-da-carteira.htm',
    referenceDate: data.header && data.header.date ? data.header.date : null,
    tickers: rows
      .map((row) => row.cod || row.code || row.ticker || row.symbol)
      .filter(Boolean)
      .map((ticker) => String(ticker).trim().toUpperCase()),
  };
}

async function loadLocalIbovReference(
  filePath = path.join(process.cwd(), 'data', 'ibov-current-reference.json'),
) {
  const payload = JSON.parse(await fs.readFile(filePath, 'utf8'));
  return {
    source: payload.source,
    sourceUrl: payload.sourceUrl,
    referenceDate: payload.referenceDate,
    tickers: payload.constituents
      ? [...payload.constituents]
          .sort((left, right) => Number(right.weight || 0) - Number(left.weight || 0))
          .map((constituent) => constituent.ticker)
      : payload.tickers || [],
    constituents: payload.constituents || [],
  };
}

module.exports = {
  buildB3PortfolioUrl,
  fetchIbovFromB3,
  loadLocalIbovReference,
};
