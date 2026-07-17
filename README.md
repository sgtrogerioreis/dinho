# DINHO

DINHO is a Discord bot for Brazilian stock valuation. The current MVP is published-ready and includes one slash command, `/graham`, backed by a local JSON provider and a domain-layer Graham valuation engine.

## Current status

Implemented:

- Discord integration with `discord.js`
- guild-scoped slash command registration script
- `/graham` slash command
- Graham valuation in the domain layer
- local JSON provider with sample company data

Not implemented:

- `/bazin`
- `/fcd`
- external financial APIs
- database
- Discloud deployment execution

## Version

Current project version: `0.1.0`

## Requirements

- Node.js `22.12.0` or higher
- npm `10` or higher

The official `discord.js` documentation currently requires Node.js `22.12.0` or newer. The project is configured accordingly. The current Discloud documentation also supports `VERSION=latest` for bots, which is the value used in `discloud.config`.

## Project setup

1. Create an application in the Discord Developer Portal.
2. Create a bot inside that application.
3. Copy the Application ID as `DISCORD_CLIENT_ID`.
4. Copy the bot token as `DISCORD_TOKEN`.
5. Copy the development server ID as `DISCORD_GUILD_ID`.

Minimum installation permissions:

- `bot`
- `applications.commands`

The bot only uses slash commands and only requests the `Guilds` intent.

## Environment variables

Create `.env` from `.env.example`:

```bash
cp .env.example .env
```

PowerShell:

```powershell
Copy-Item .env.example .env
```

Required variables:

- `DISCORD_TOKEN`
- `DISCORD_CLIENT_ID`
- `DISCORD_GUILD_ID`

`DISCORD_TOKEN` is required for startup. `DISCORD_CLIENT_ID` and `DISCORD_GUILD_ID` are required for `npm run register:commands`.

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
- uses the existing `calculateGrahamValuationByTicker` service
- uses the local JSON provider
- formats the domain result for Discord in `pt-BR`

## Graham method

Formula:

```text
fairValue = sqrt(grahamMultiplier * EPS * BVPS)
marginOfSafety = ((fairValue - currentPrice) / currentPrice) * 100
```

Current assumptions:

- `grahamMultiplier = 22.5`
- `fairValueTolerancePercentage = 5`

Status mapping in the Discord presentation layer:

- `UNDERVALUED` -> `Aparentemente abaixo do preço justo`
- `FAIRLY_VALUED` -> `Próxima do preço justo`
- `OVERVALUED` -> `Aparentemente acima do preço justo`

The result is an informative mathematical estimate and does not constitute investment advice.

## Response example

```text
DINHO - Método de Graham

Ticker: PETR4
Preço atual: R$ 34,50
Preço justo: R$ 80,58
Margem de segurança: 133,55%
Situação: Aparentemente abaixo do preço justo

Dados utilizados:
LPA: R$ 6,82
VPA: R$ 42,31

Fórmula:
√(22,5 × LPA × VPA)

Cálculo informativo. Não constitui recomendação de investimento.
```

## Validation

Run the full validation suite with:

```bash
npm run validate
```

This command does not connect to Discord and does not register commands.

## Architecture summary

- `src/commands`: slash command definition and execution layer
- `src/discord`: Discord client creation, interaction routing, formatters and command registry
- `src/services`: orchestration between ticker, provider and valuation method
- `src/providers`: company data source abstraction and local implementation
- `src/valuation`: pure domain logic for Graham

The financial formula remains outside the Discord layer, and the provider remains independent from valuation rules.

## Error handling

Current user-facing messages:

- invalid ticker: `Informe um ticker válido, como PETR4.`
- missing ticker data: `Não encontrei dados para o ticker informado.`
- insufficient data: `Não há dados suficientes para calcular Graham para este ticker.`
- configuration issue: `O DINHO não está configurado corretamente no momento.`
- unexpected issue: `Não foi possível concluir o cálculo agora.`

Technical details remain in local logs and are not exposed to Discord users.

## Current limitations

- only Graham is implemented
- data still comes from local JSON
- Bazin and FCD are not implemented
- commands are registered only at guild scope
- the project is prepared for Discloud, but this README does not perform deployment
