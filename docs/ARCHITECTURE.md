# DINHO Architecture

## Current scope

DINHO now implements:

- the Graham valuation method in the domain layer
- the Discord integration required for one slash command
- the `/graham` command routed through the service and provider layers

The project still does not implement Bazin, discounted cash flow or external APIs.

## Active modules

- `src/config`: application-level configuration, such as selecting the company provider.
- `src/constants`: reusable domain constants.
- `src/errors`: semantic application errors.
- `src/models`: domain models.
- `src/providers`: company data access and provider factory.
- `src/services`: application use cases that orchestrate providers and domain methods.
- `src/utils`: shared technical helpers.
- `src/validators`: input and data consistency validation.
- `src/valuation`: valuation domain space with Graham assumptions, status rules, result contract and methods.
- `src/commands`: slash command definition and execution orchestration.
- `src/discord`: Discord client creation, command registry, interaction routing and presentation formatting.

## Current runtime flow

```text
src/index.js
    ->
application config
    ->
provider factory
    ->
discord client
    ->
interaction handler
    ->
/graham command
    ->
Graham service
    ->
local company provider
    ->
companies.json
    ->
company model
    ->
Graham valuation method
    ->
valuation result
    ->
Discord formatter
```

## Current architectural decisions

- Providers are created through a factory so the application entry point does not depend directly on a concrete provider.
- The `Company` model does not perform infrastructure access.
- Validation logic is separated from models to keep responsibilities narrow.
- Domain and infrastructure failures use named error classes to support future user-friendly error handling.
- Financial assumptions are placed under `src/valuation/assumptions` because they belong to the valuation domain, not to generic application configuration.
- A service layer now exists because there is a real use case: receive a ticker, ask the provider for the company and execute Graham without coupling the method to the data source.
- The standardized valuation result is immutable and interface-agnostic.
- The Discord layer only formats and routes interactions; it does not implement valuation formulas.
- Slash command registration is isolated in `scripts/register-commands.js` and does not run during startup.

## Intentionally absent modules

- `interfaces/` was not created because CommonJS does not provide formal interfaces and a dedicated provider contract already exists.
- `types/` was not created because the project is still JavaScript-only and there is no immediate need for a separate typing layer.

## Discord integration notes

- `discord.js` is the only Discord dependency installed.
- Only `GatewayIntentBits.Guilds` is used because this sprint handles slash commands only.
- Guild-scoped registration is used for development through `DISCORD_GUILD_ID`.
- User-facing Discord errors are friendly and short; technical details remain in logs.

## Current limitations

- Only `/graham` exists.
- The provider is still local JSON.
- Bazin and discounted cash flow remain outside the implemented runtime.
