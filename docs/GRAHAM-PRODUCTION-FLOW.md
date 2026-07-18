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

`close_price` is the price returned by `/fundamentals/{ticker}`. The command does not call an
additional quote endpoint, so it does not display a quote trade date.

`reference_date` is the fundamentals balance-sheet reference date used for LPA/VPA and is displayed
as `Data-base dos Fundamentos`.

The provider uses `BOLSAI_API_KEY` only through the `X-API-Key` header. The key is never logged.

## Cache

The production provider uses `TtlCache` from `src/cache/ttlCache.js`.

The cache key is scoped to Graham and ticker, and the TTL is configured through `app.companyProvider.bolsai.cacheTtlMs`.

The cache stores only Graham input data. It does not store the Discord presentation timestamp, so
`Consultado em` always reflects the moment the user executed the command, even when Graham inputs
come from cache.

## PermissionGuard

`src/permissions/permissionGuard.js` centralizes command permission checks.

In this sprint, only members with the configured owner role can execute `/graham`.

Production should use `OWNER_ROLE_ID`. The `DISCORD_OWNER_ROLE_NAME` fallback exists for local compatibility and defaults to `DONO` when no role ID is configured.

The command does not hardcode role logic.

## Renderer

`src/discord/renderers/analysisEmbedRenderer.js` renders any `AnalysisResult`.

Current Graham embed:

- title: `Benjamin Graham`
- description: `Analise de preco justo.`
- fields: company, ticker, current price, Graham price, margin of safety, LPA, VPA, status,
  fundamentals reference date, consultation timestamp and data source
- footer: `Dados fornecidos por BolsAI.`

`Consultado em` is generated at command execution time and formatted in the `America/Sao_Paulo`
timezone as `DD/MM/AAAA às HH:mm`.

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
