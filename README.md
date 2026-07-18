# DINHO

DINHO is a Discord bot for Brazilian stock valuation. The production `/graham` command uses BolsAI Free for the homologated Graham inputs and renders a provider-independent `AnalysisResult` contract that can also serve future `/bazin` and `/dcf` flows.

## Current status

Implemented:

- Discord integration with `discord.js`
- guild-scoped slash command registration script
- `/graham` slash command
- Graham valuation in the domain layer
- provider factory with `local` and `api` options kept for the legacy company-provider path
- local JSON provider with sample company data
- BRAPI integration for real quote and fundamentals data
- BolsAI Graham provider for production `/graham`
- shared `AnalysisResult` contract
- shared Discord analysis embed renderer
- `PermissionGuard` for command access control

Not implemented:

- `/bazin`
- `/fcd`
- production TTL cache for Graham inputs
- retry
- rate limiter
- database

## Version

Current project version: `0.1.0`

## Requirements

- Node.js `22.12.0` or higher
- npm `10` or higher

## Provider configuration

The legacy company provider remains selected centrally through the environment:

```env
PROVIDER=local
```

Supported values:

- `local`
- `api`

Legacy behavior:

- `PROVIDER=local`: uses `LocalCompanyProvider` and reads from `data/companies.json`
- `PROVIDER=api`: uses `ApiCompanyProvider` and fetches real data from BRAPI

Production `/graham` no longer uses BRAPI or this provider switch. It uses `BOLSAI_API_KEY` through the BolsAI Graham provider and calls only:

```text
GET https://api.usebolsai.com/api/v1/fundamentals/{ticker}
```

## BRAPI authentication

DINHO uses the official BRAPI backend pattern:

- environment variable: `BRAPI_API_KEY`
- authentication method: `Authorization: Bearer <token>`
- location: HTTP header

Why this project uses `BRAPI_API_KEY`:

- the BRAPI REST docs describe the credential generically as a token
- the official JavaScript SDK examples use `process.env.BRAPI_API_KEY`
- the project now standardizes on that official SDK-style variable name

Security rules in this project:

- `BRAPI_API_KEY` is not required when `PROVIDER=local`
- `BRAPI_API_KEY` is required when `PROVIDER=api`
- the key is never logged by the application
- the key is never documented with a real value

## BRAPI integration

BRAPI remains in the repository for the legacy provider architecture and tests. It is not used by the production `/graham` flow.

This project uses only official BRAPI endpoints for Graham:

- `GET /api/v2/stocks/quote?symbols=PETR4`
- `GET /api/v2/stocks/statistics?symbols=PETR4&mode=current`

Mapped fields:

- `quote.data.regularMarketPrice` -> `price`
- `statistics.data.earningsPerShare` -> `eps`
- `statistics.data.bookValue` -> `bookValuePerShare`
- `quote.symbol` -> `ticker`
- `quote.data.longName` or `quote.data.shortName` -> `name`

## Environment variables

Create `.env` from `.env.example`:

```bash
cp .env.example .env
```

PowerShell:

```powershell
Copy-Item .env.example .env
```

Relevant variables:

- `PROVIDER`
- `BRAPI_API_KEY`
- `BOLSAI_API_KEY`
- `DISCORD_TOKEN`
- `DISCORD_CLIENT_ID`
- `DISCORD_GUILD_ID`
- `OWNER_ROLE_ID`
- `DISCORD_OWNER_ROLE_NAME`

Notes:

- `DISCORD_TOKEN` is required for startup
- `DISCORD_CLIENT_ID` and `DISCORD_GUILD_ID` are required for `npm run register:commands`
- `BOLSAI_API_KEY` is required for production `/graham`
- `OWNER_ROLE_ID` is recommended for production access control
- `DISCORD_OWNER_ROLE_NAME` defaults to `DONO` only when `OWNER_ROLE_ID` is not configured

## Installation

```bash
npm install
```

## Registering slash commands

```bash
npm run register:commands
```

This script:

- validates the required Discord environment variables
- registers commands only in the development guild
- does not run during `npm start`
- does not register commands globally

## Starting locally

```bash
npm start
```

With a valid `.env`, DINHO will:

- connect to Discord
- stay online waiting for interactions
- respond to `/graham`

## Available command

```text
/graham ticker:PETR4
```

The command:

- normalizes the ticker through the shared utility
- accepts examples such as `PETR4`, `PETR4F` and `petr4`
- checks access through `PermissionGuard`
- uses `analyzeGrahamByTicker`
- calls only the BolsAI fundamentals endpoint
- returns an `AnalysisResult`
- renders through the shared `AnalysisEmbedRenderer`

## Graham method

Formula:

```text
fairPrice = sqrt(22.5 * LPA * VPA)
marginOfSafety = ((fairPrice - currentPrice) / fairPrice) * 100
```

Current assumptions:

- `grahamMultiplier = 22.5`
- `fairValueTolerancePercentage = 5`

Status mapping:

- `UNDERVALUED` -> `Aparentemente abaixo do preco justo`
- `FAIR_VALUE` -> `Proxima do preco justo`
- `OVERVALUED` -> `Aparentemente acima do preco justo`
- `NOT_APPLICABLE` -> `Graham nao aplicavel`
- `ERROR` -> `Erro`

When LPA or VPA are equal to or below zero, DINHO returns `NOT_APPLICABLE` and does not calculate a square root or artificial fair price.

The result is an informative mathematical estimate and does not constitute investment advice.

## Validation

Run the full validation suite with:

```bash
npm run validate
```

This command does not connect to Discord and does not register commands.

## BRAPI coverage validation

To validate a real BRAPI sample after filling `BRAPI_API_KEY`:

```bash
node scripts/check-brapi-coverage.js
```

This script checks:

- `PETR4`
- `VALE3`
- `BBAS3`
- `ITUB4`
- `BBDC4`
- `WEGE3`
- `TAEE11`
- `BBSE3`
- `ABEV3`
- `SUZB3`

It records only:

- current price
- EPS
- BVPS
- field availability
- success or failure type
- query timestamp

## Manual provider switching

Examples:

```bash
PROVIDER=local
```

or

```bash
PROVIDER=api
```

On Windows PowerShell for a temporary session:

```powershell
$env:PROVIDER='api'
npm start
```

## Architecture summary

- `src/commands`: slash command definition and execution layer
- `src/discord`: Discord client creation, interaction routing, formatters and command registry
- `src/analysis`: provider-independent analysis contract, statuses and method calculations
- `src/services`: orchestration between ticker, provider and analysis method
- `src/providers`: company data source abstraction, factory, BRAPI client and concrete providers
- `src/valuation`: pure domain logic for Graham
- `src/permissions`: command access guards
- `src/cache`: shared TTL cache

The financial formula remains outside the Discord layer, and the provider layer can be swapped through configuration only.

## Error handling

Current user-facing messages:

- invalid ticker: `Ticker inválido.`
- missing ticker data: `Nao encontrei dados para o ticker informado.`
- insufficient data: `Dados ausentes para concluir a analise deste ticker.`
- restricted command: `Este comando ainda esta em fase de testes.`
- provider auth or configuration issue: `O provedor de dados nao esta disponivel corretamente no momento.`
- temporary API issue: `A fonte de dados esta indisponivel no momento. Tente novamente em instantes.`
- unexpected issue: `Nao foi possivel concluir a analise agora.`

Infrastructure-level provider errors are converted to semantic project errors before reaching the rest of the application.

## Current limitations

- only Graham is implemented
- Bazin and FCD are not implemented
- commands are registered only at guild scope
