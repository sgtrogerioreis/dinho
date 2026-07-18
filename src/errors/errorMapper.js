const { AccessDeniedError } = require('./accessDeniedError');
const { ConfigurationError } = require('./configurationError');
const { FundamentalDataUnavailableError } = require('./fundamentalDataUnavailableError');
const { InvalidCredentialError } = require('./invalidCredentialError');
const { InvalidTickerError } = require('./invalidTickerError');
const { MissingCredentialError } = require('./missingCredentialError');
const { NotFoundError } = require('./notFoundError');
const { PermissionDeniedError } = require('./permissionDeniedError');
const { RateLimitError } = require('./rateLimitError');
const { TemporaryDataSourceError } = require('./temporaryDataSourceError');
const { ValidationError } = require('./validationError');

const EPHEMERAL_MESSAGE_FLAG = 64;

class ErrorMapper {
  toDiscordPayload(error) {
    if (error instanceof InvalidTickerError) {
      return {
        content: 'Ticker inválido.',
        flags: EPHEMERAL_MESSAGE_FLAG,
      };
    }

    if (error instanceof NotFoundError) {
      return {
        content: 'Nao encontrei dados para o ticker informado.',
        flags: EPHEMERAL_MESSAGE_FLAG,
      };
    }

    if (error instanceof PermissionDeniedError) {
      return {
        content: 'Este comando ainda está em fase de testes.',
        flags: EPHEMERAL_MESSAGE_FLAG,
      };
    }

    if (error instanceof RateLimitError) {
      return {
        content: 'A fonte de dados atingiu o limite de consultas. Tente novamente mais tarde.',
        flags: EPHEMERAL_MESSAGE_FLAG,
      };
    }

    if (error instanceof TemporaryDataSourceError) {
      return {
        content: 'A fonte de dados esta indisponivel no momento. Tente novamente em instantes.',
        flags: EPHEMERAL_MESSAGE_FLAG,
      };
    }

    if (error instanceof AccessDeniedError) {
      return {
        content: 'Nao foi possivel acessar os dados deste ativo na fonte atual.',
        flags: EPHEMERAL_MESSAGE_FLAG,
      };
    }

    if (
      error instanceof MissingCredentialError ||
      error instanceof InvalidCredentialError ||
      error instanceof ConfigurationError
    ) {
      return {
        content: 'O provedor de dados nao esta disponivel corretamente no momento.',
        flags: EPHEMERAL_MESSAGE_FLAG,
      };
    }

    if (error instanceof FundamentalDataUnavailableError || error instanceof ValidationError) {
      return {
        content: 'Dados ausentes para concluir a analise deste ticker.',
        flags: EPHEMERAL_MESSAGE_FLAG,
      };
    }

    return {
      content: 'Nao foi possivel concluir a analise agora.',
      flags: EPHEMERAL_MESSAGE_FLAG,
    };
  }
}

module.exports = {
  EPHEMERAL_MESSAGE_FLAG,
  ErrorMapper,
};
