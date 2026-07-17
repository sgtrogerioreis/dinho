# BRAPI Coverage For Graham

## Purpose

This document tracks whether BRAPI provides the minimum data required for the Graham method in DINHO:

- current price
- EPS / LPA
- BVPS / VPA

It does not claim total market coverage. A sample of ten tickers is useful for validation, but it is not a guarantee for every B3 asset.

## Official endpoints used

- `GET /api/v2/stocks/quote`
- `GET /api/v2/stocks/statistics?mode=current`

## Mapped fields

- `quote.data.regularMarketPrice` -> current price
- `statistics.data.earningsPerShare` -> LPA
- `statistics.data.bookValue` -> VPA
- `quote.symbol` -> ticker
- `quote.data.longName || quote.data.shortName` -> company name

## Authentication model

- environment variable: `BRAPI_API_KEY`
- method: `Authorization: Bearer <token>`
- scope in DINHO: backend only

## Tickers selected for the sample

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

## Authenticated coverage run

Consultation date:

- `2026-07-17`

Consultation timestamps are recorded in UTC because the validation script emits ISO timestamps.

### Real sample results

| Ticker   | Queried At (UTC)           |   Price |         LPA |         VPA | Graham Fair Value | Status          | Result              |
| -------- | -------------------------- | ------: | ----------: | ----------: | ----------------: | --------------- | ------------------- |
| `PETR4`  | `2026-07-17T02:19:23.142Z` | `39.89` |  `8.347058` | `34.540943` |         `80.5425` | `UNDERVALUED`   | `success`           |
| `VALE3`  | `2026-07-17T02:19:23.543Z` | `72.98` |  `3.117031` | `43.074818` |         `54.9634` | `OVERVALUED`    | `success`           |
| `BBAS3`  | `2026-07-17T02:19:23.850Z` |     `-` |         `-` |         `-` |               `-` | `-`             | `AccessDeniedError` |
| `ITUB4`  | `2026-07-17T02:19:24.156Z` | `42.55` | `4.1703587` |  `19.01764` |         `42.2431` | `FAIRLY_VALUED` | `success`           |
| `BBDC4`  | `2026-07-17T02:19:24.463Z` |     `-` |         `-` |         `-` |               `-` | `-`             | `AccessDeniedError` |
| `WEGE3`  | `2026-07-17T02:19:24.773Z` |     `-` |         `-` |         `-` |               `-` | `-`             | `AccessDeniedError` |
| `TAEE11` | `2026-07-17T02:19:25.121Z` |     `-` |         `-` |         `-` |               `-` | `-`             | `AccessDeniedError` |
| `BBSE3`  | `2026-07-17T02:19:25.446Z` |     `-` |         `-` |         `-` |               `-` | `-`             | `AccessDeniedError` |
| `ABEV3`  | `2026-07-17T02:19:25.756Z` |     `-` |         `-` |         `-` |               `-` | `-`             | `AccessDeniedError` |
| `SUZB3`  | `2026-07-17T02:19:26.066Z` |     `-` |         `-` |         `-` |               `-` | `-`             | `AccessDeniedError` |

### Coverage summary

- Successful Graham inputs and result available: `PETR4`, `VALE3`, `ITUB4`
- Failed due to plan access restriction in BRAPI statistics: `BBAS3`, `BBDC4`, `WEGE3`, `TAEE11`, `BBSE3`, `ABEV3`, `SUZB3`
- Tickers with missing Graham data because of provider-side field absence: none in this authenticated run
- Tickers not found: none in this authenticated run

## Failure types tracked by DINHO

- missing credential
- invalid credential
- plan access denied
- rate limit
- ticker not found
- insufficient Graham fundamentals
- temporary BRAPI failure
- generic provider failure

## Failures found in the real run

- The authenticated plan behind the current `BRAPI_API_KEY` does not grant access to `defaultKeyStatistics` for 7 of the 10 sampled tickers.
- BRAPI returned a real plan restriction payload for those cases, and DINHO now maps it semantically to `AccessDeniedError`.
- The quote endpoint itself is not the blocker in those cases; the restriction affects the statistics data required for Graham.

## Known limitations

- BRAPI plan limits depend on the authenticated account.
- The free-plan guidance published by BRAPI examples may not match every paid plan.
- Field availability can vary by ticker and by BRAPI coverage source.
- A ticker can have a valid market price and still lack enough fundamentals for Graham.
- This sample does not guarantee total B3 coverage.

## Viability conclusion

Current conclusion after the authenticated sample:

- BRAPI is architecturally viable for Graham in DINHO.
- The provider contract is stable and isolated from the valuation layer.
- The current authenticated plan is not sufficient for broad Graham coverage, because only 3 of the 10 sampled tickers exposed the required statistics fields through the authorized endpoint combination.
- For production use of Graham across a wider B3 sample, the BRAPI plan must include statistics access for more tickers.
