# DINHO Architecture

## Current scope

DINHO currently implements:

- the Graham analysis method in the analysis layer
- the Discord integration required for one slash command
- the `/graham` command routed through the service and provider layers
- a configurable provider architecture with `local` and `api` provider options
- real BRAPI-backed data retrieval when `PROVIDER=api`
- production BolsAI-backed Graham data retrieval
- shared `AnalysisResult` and `AnalysisEmbedRenderer`
- centralized `PermissionGuard` and `ErrorMapper`

The project still does not implement Bazin, discounted cash flow, retry or rate limiting.

## Active modules

- `src/config`: application-level configuration, including provider selection
- `src/analysis`: provider-independent analysis results, statuses and calculations
- `src/cache`: TTL cache infrastructure
- `src/constants`: reusable domain constants
- `src/errors`: semantic application and infrastructure errors
- `src/models`: domain models
- `src/providers`: company data contract, factory, BRAPI client, mapping layer and concrete providers
- `src/services`: application use cases that orchestrate providers and domain methods
- `src/utils`: shared technical helpers
- `src/validators`: input and data consistency validation
- `src/valuation`: valuation domain space with Graham assumptions, status rules, result contract and methods
- `src/commands`: slash command definition and execution orchestration
- `src/discord`: Discord client creation, command registry, interaction routing and presentation formatting
- `src/permissions`: reusable command access guards

## Current runtime flow

```text
src/index.js
    ->
application config
    ->
discord client
    ->
interaction handler
    ->
/graham command
    ->
Graham service
    ->
BolsaiGrahamProvider
    ->
BolsAI /fundamentals/{ticker}
    ->
Graham analysis method
    ->
AnalysisResult
    ->
AnalysisEmbedRenderer
```

## Provider architecture

The provider selection is centralized in configuration through:

```text
PROVIDER=local
```

or

```text
PROVIDER=api
```

Current provider behavior:

- `LocalCompanyProvider`: reads versioned sample data from `data/companies.json`
- `ApiCompanyProvider`: calls BRAPI and maps the response to the same `Company` contract used by the local provider
- `BolsaiGrahamProvider`: production provider for `/graham`, calling only BolsAI `/fundamentals/{ticker}`

Legacy company providers expose:

```js
await companyProvider.getCompanyByTicker(ticker);
```

The production Graham provider exposes:

```js
await grahamProvider.getGrahamInputsByTicker(ticker);
```

## BRAPI authentication design

The BRAPI credential is standardized as:

```text
BRAPI_API_KEY
```

The project sends it only through:

```text
Authorization: Bearer <token>
```

Design choices:

- the credential is required only when `PROVIDER=api`
- the header format is centralized in `src/providers/brapi/httpClient.js`
- services, commands and valuation code do not know header names or token formats
- logs use sanitized error summaries instead of raw HTTP objects

BRAPI is not used by the production `/graham` flow after Sprint 8.

## BolsAI Graham integration

The BolsAI credential is standardized as:

```text
BOLSAI_API_KEY
```

The project sends it only through:

```text
X-API-Key: <token>
```

Production Graham consumes only the Free endpoint:

```text
GET https://api.usebolsai.com/api/v1/fundamentals/{ticker}
```

Fields consumed from BolsAI:

- `close_price`
- `reference_date`
- `lpa`
- `vpa`
- `net_income`
- `equity`
- `shares_outstanding`
- `corporate_name`

No dividends, financials or history endpoints are used by production Graham.

## BRAPI integration details

Official BRAPI endpoints used by Graham:

- `GET /api/v2/stocks/quote`
- `GET /api/v2/stocks/statistics?mode=current`

Fields consumed from BRAPI:

- `results[0].symbol`
- `results[0].data.longName`
- `results[0].data.shortName`
- `results[0].data.regularMarketPrice`
- `results[0].data.earningsPerShare`
- `results[0].data.bookValue`
- `results[0].data.sharesOutstanding`

The BRAPI field names are centralized in the provider integration layer so they do not leak into services, commands or valuation logic.

## Error handling in the API provider

The BRAPI integration maps infrastructure failures into semantic project errors such as:

- `MissingCredentialError`
- `InvalidCredentialError`
- `AccessDeniedError`
- `RateLimitError`
- `NotFoundError`
- `FundamentalDataUnavailableError`
- `TemporaryDataSourceError`
- `DataSourceError`

This keeps the rest of the application independent from raw HTTP or BRAPI-specific error formats.

## Current architectural decisions

- Providers are created through a factory so the application entry point does not depend directly on a concrete provider.
- The active provider is chosen only through configuration, not by services or commands.
- The `Company` model does not perform infrastructure access.
- Validation logic is separated from models to keep responsibilities narrow.
- Domain and infrastructure failures use named error classes to support future user-friendly error handling.
- Financial assumptions are placed under `src/valuation/assumptions` because they belong to the valuation domain, not to generic application configuration.
- A service layer exists because there is a real use case: receive a ticker, ask the provider for the company and execute Graham without coupling the method to the data source.
- The standardized valuation result is immutable and interface-agnostic.
- The standardized analysis result is immutable and interface-agnostic.
- The Discord embed renderer consumes `AnalysisResult` so future Bazin and DCF commands do not need duplicate embed code.
- Permission checks live in `PermissionGuard`, not inside reusable analysis or provider layers. Production access should be configured through `OWNER_ROLE_ID`.
- The Discord layer only formats and routes interactions; it does not implement valuation formulas.
- Slash command registration is isolated in `scripts/register-commands.js` and does not run during startup.

## Discord integration notes

- `discord.js` is the only Discord dependency installed.
- Only `GatewayIntentBits.Guilds` is used because the runtime handles slash commands only.
- Guild-scoped registration is used for development through `DISCORD_GUILD_ID`.
- User-facing Discord errors are friendly and short.
- Runtime logs are sanitized and do not print BRAPI or BolsAI credentials.

## Current limitations

- Only `/graham` exists.
- Retry and rate limiting remain outside the runtime.
- Bazin and discounted cash flow remain outside the implemented runtime.
