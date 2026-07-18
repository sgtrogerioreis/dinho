const test = require('node:test');
const assert = require('node:assert/strict');

const { InvalidTickerError } = require('../../src/errors/invalidTickerError');
const { PermissionDeniedError } = require('../../src/errors/permissionDeniedError');
const { RateLimitError } = require('../../src/errors/rateLimitError');
const { TemporaryDataSourceError } = require('../../src/errors/temporaryDataSourceError');
const { ErrorMapper } = require('../../src/errors/errorMapper');

test('ErrorMapper maps validation and permission messages to friendly Portuguese payloads', () => {
  const mapper = new ErrorMapper();

  assert.equal(mapper.toDiscordPayload(new InvalidTickerError('bad')).content, 'Ticker inválido.');
  assert.equal(
    mapper.toDiscordPayload(new PermissionDeniedError('blocked')).content,
    'Este comando ainda está em fase de testes.',
  );
});

test('ErrorMapper maps rate limit and timeout separately', () => {
  const mapper = new ErrorMapper();

  assert.match(mapper.toDiscordPayload(new RateLimitError('busy')).content, /limite/);
  assert.match(
    mapper.toDiscordPayload(new TemporaryDataSourceError('timeout')).content,
    /indisponivel/,
  );
});
