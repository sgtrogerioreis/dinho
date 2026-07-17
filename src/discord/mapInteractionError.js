const { MessageFlags } = require('discord.js');
const { AccessDeniedError } = require('../errors/accessDeniedError');
const { ConfigurationError } = require('../errors/configurationError');
const { FundamentalDataUnavailableError } = require('../errors/fundamentalDataUnavailableError');
const { InvalidCredentialError } = require('../errors/invalidCredentialError');
const { InvalidTickerError } = require('../errors/invalidTickerError');
const { MissingCredentialError } = require('../errors/missingCredentialError');
const { NotFoundError } = require('../errors/notFoundError');
const { RateLimitError } = require('../errors/rateLimitError');
const { TemporaryDataSourceError } = require('../errors/temporaryDataSourceError');
const { ValidationError } = require('../errors/validationError');

function mapInteractionError(error) {
  if (error instanceof NotFoundError) {
    return {
      content: 'Nao encontrei dados para o ticker informado.',
    };
  }

  if (error instanceof InvalidTickerError) {
    return {
      content: 'Informe um ticker valido, como PETR4.',
    };
  }

  if (error instanceof FundamentalDataUnavailableError || error instanceof ValidationError) {
    return {
      content: 'Nao ha dados suficientes para calcular Graham para este ticker.',
    };
  }

  if (error instanceof AccessDeniedError) {
    return {
      content: 'Nao foi possivel acessar os dados fundamentalistas deste ativo na fonte atual.',
      flags: MessageFlags.Ephemeral,
    };
  }

  if (
    error instanceof MissingCredentialError ||
    error instanceof InvalidCredentialError ||
    error instanceof ConfigurationError
  ) {
    return {
      content: 'O provedor de dados nao esta disponivel corretamente no momento.',
      flags: MessageFlags.Ephemeral,
    };
  }

  if (error instanceof RateLimitError || error instanceof TemporaryDataSourceError) {
    return {
      content: 'A BRAPI esta indisponivel no momento. Tente novamente em instantes.',
      flags: MessageFlags.Ephemeral,
    };
  }

  return {
    content: 'Nao foi possivel concluir o calculo agora.',
    flags: MessageFlags.Ephemeral,
  };
}

module.exports = {
  mapInteractionError,
};
