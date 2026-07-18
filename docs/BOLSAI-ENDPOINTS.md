# BolsAI Endpoints

Fonte oficial consultada: https://usebolsai.com/docs

Base URL: `https://api.usebolsai.com/api/v1`

## Autenticacao

- Todas as requisicoes autenticadas usam o header `X-API-Key`.
- A chave deve ser lida de `process.env.BOLSAI_API_KEY`.
- O endpoint publico `/health` nao requer autenticacao.
- O endpoint `/keys/usage` usa `api_key` como query parameter para consultar uso da chave, mas a homologacao evita registra-la em logs ou relatorios.

## Limites

- Plano Free: 200 requisicoes por dia, fundamentos e precos atuais, busca de empresas e FIIs.
- Plano Pro: 10.000 requisicoes por dia, todos os endpoints liberados, historicos de 10+ anos.
- Reset do limite: meia-noite UTC.
- Rate limit excedido: `429 Too Many Requests`.
- Header de controle: `X-RateLimit-Remaining`.

## Empresas

- `GET /companies`
- Filtros: `sector`, `status`, `search`, `limit` (1-500, padrao 50), `offset`.
- Resposta paginada com `data`, `count`, `total`, `offset`, `limit`.
- `GET /companies/sectors`
- `GET /companies/{ticker}`
- Campos documentados incluem `ticker_primary`, `queried_ticker`, `tickers`, `corporate_name`, `trade_name`, `cvm_code`, `cnpj`, `sector`, `status`, `registration_date`, `registration_category`, `market_type`, `country`, `state`, `city`, `email`, `website`.

## Acoes

- `GET /stocks`
- Lista tickers por `bdi_code`: `02` acoes, `12` FIIs, `14` BDRs.
- Paginacao: `limit` (1-5000, padrao 500), `offset`.
- `GET /stocks/{ticker}/quote`
- Campos documentados: `ticker`, `trade_date`, `open`, `high`, `low`, `close`, `volume`, `traded_amount`, `num_trades`.
- `GET /stocks/{ticker}/stats`
- Campos documentados: `ticker`, `trade_date`, `close`, variacao diaria, maxima/minima 52 semanas, volume medio 52 semanas e retorno YTD.
- `GET /stocks/{ticker}/history` PRO
- Filtros: `start`, `end` em `YYYY-MM-DD`, `limit` (1-5000, padrao 252).
- `GET /stocks/{ticker}/corporate-events` PRO
- `GET /stocks/corporate-events` PRO, com filtro `year` e `limit`.
- `GET /stocks/{ticker}/ticker-history` PRO.

## Fundamentos

- `GET /fundamentals/{ticker}`
- Fornece indicadores atuais por ticker, incluindo preco de fechamento, `lpa`, `vpa`, `dividend_yield`, `market_cap`, `shares_outstanding`, margens, endividamento e campos-base como `net_income`, `equity`, `net_revenue`, `total_debt`, `ebitda`, `ebit`, `net_debt`, `cash`, `total_assets`.
- `GET /fundamentals/{ticker}/history` PRO
- Historico trimestral, do mais recente ao mais antigo.
- Parametro: `limit` (1-80, padrao 40).

## Demonstracoes Financeiras

- `GET /financials/{ticker}` PRO
- Parametros: `report_type` (`DFP` anual ou `ITR` trimestral), `statement_type` (`BPA`, `BPP`, `DRE`, `DFC_MI`, `DVA`), `reference_date` em `YYYY-MM-DD`, `limit` (1-5000, padrao 1000).
- Resposta documentada com `ticker`, `cvm_code`, `report_type`, `count`, `statements`.
- Cada linha possui `reference_date`, `statement_type`, `account_code`, `account_name`, `value`.
- A documentacao informa DFP anual e ITR trimestral da CVM, incluindo BPA, BPP, DRE, DFC_MI e DVA.
- A documentacao nao explicita campo de escala monetaria, moeda, consolidado ou individual no exemplo.

## Dividendos

- `GET /dividends/{ticker}` PRO
- Parametro: `years` (1-20, padrao 5).
- Campos documentados: `dividend_yield_ttm`, `ttm_per_share`, `current_price`, `total_payments`, `annual_summary`, `payments`.
- Pagamentos incluem `ex_date`, `payment_date`, `type`, `value_per_share`, `adjusted`.
- A descricao menciona data com, data ex, data de pagamento, tipo e valor por acao, mas o exemplo publicado nao exibe um campo separado para data com.
- A documentacao nao explicita moeda no exemplo.

## Screener

- `GET /screener` PRO
- Suporta filtros `{metric}_gt` e `{metric}_lt`, `sector`, `sort`, `order`, `limit`, `offset`.
- A documentacao informa que conta como 1 requisicao e retorna uma linha por empresa, no nivel da empresa/ticker principal.

## Ibovespa

- A documentacao publica consultada nao lista endpoint de composicao de indices.
- Para a camada Ibovespa, a homologacao tenta a fonte oficial da B3 e usa fallback local versionado se necessario.

## Codigos de Erro

- `429 Too Many Requests` e documentado para limite excedido.
- `503` e documentado no `/health` quando algum servico esta degradado.
- Os endpoints de gerenciamento de chaves documentam `400` para limite de chaves e exclusao invalida.
- A documentacao publica nao lista uma tabela completa de `401`, `403`, `404` e `5xx`; o cliente de homologacao os classifica semanticamente por status HTTP.
