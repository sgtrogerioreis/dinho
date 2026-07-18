# Graham Production Flow

## Scope

Production `/graham` uses BolsAI Free exclusively. It calls only:

```text
GET /fundamentals/{ticker}
```

It does not call dividends, financial statements, fundamentals history or any PRO endpoint.

## Contract

All analysis methods return `AnalysisResult` from `src/analysis/analysisResult.js`.

Fields:

- `method`
- `ticker`
- `companyName`
- `currentPrice`
- `fairPrice`
- `marginOfSafety`
- `status`
- `referenceDate`
- `provider`
- `inputs`
- `warnings`
- `metadata`

This contract is independent from Discord and is intended for Graham, Bazin and DCF.

## Status

Shared statuses live in `src/analysis/analysisStatus.js`:

- `UNDERVALUED`
- `FAIR_VALUE`
- `OVERVALUED`
- `NOT_APPLICABLE`
- `ERROR`

`NOT_APPLICABLE` is used when LPA or VPA are equal to or below zero. The Graham formula is not calculated in those cases.

## Provider

`src/providers/bolsai/grahamProvider.js` maps BolsAI fundamentals into Graham inputs:

- `close_price` -> `currentPrice`
- `lpa` -> `eps`
- `vpa` -> `bookValuePerShare`
- `reference_date` -> `referenceDate`
- `corporate_name` -> `companyName`

The provider uses `BOLSAI_API_KEY` only through the `X-API-Key` header. The key is never logged.

## Cache

The production provider uses `TtlCache` from `src/cache/ttlCache.js`.

The cache key is scoped to Graham and ticker, and the TTL is configured through `app.companyProvider.bolsai.cacheTtlMs`.

## PermissionGuard

`src/permissions/permissionGuard.js` centralizes command permission checks.

In this sprint, only members with the configured owner role name, default `DONO`, can execute `/graham`.

The command does not hardcode role logic.

## Renderer

`src/discord/renderers/analysisEmbedRenderer.js` renders any `AnalysisResult`.

Current Graham embed:

- title: `Benjamin Graham`
- description: `Analise de preco justo.`
- fields: company, ticker, current price, Graham price, margin of safety, LPA, VPA, status, quote date and data source
- footer: `Dados fornecidos por BolsAI.`

The same renderer is intended for `/bazin` and `/dcf`.

## Flow

```text
Discord interaction
  -> /graham command
  -> PermissionGuard
  -> ticker normalization
  -> analyzeGrahamByTicker
  -> BolsaiGrahamProvider
  -> TtlCache
  -> BolsAI /fundamentals/{ticker}
  -> calculateGrahamAnalysis
  -> AnalysisResult
  -> AnalysisEmbedRenderer
  -> Discord reply
```

## Error Mapping

`src/errors/errorMapper.js` maps semantic errors to short Portuguese messages:

- invalid ticker
- ticker not found
- delisted or unavailable data
- rate limit
- timeout
- unavailable API
- invalid credential
- missing data
- unexpected error

Infrastructure errors never expose credentials or raw headers.
