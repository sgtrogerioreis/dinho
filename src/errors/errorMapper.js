const { MessageFlags } = require('discord.js');
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

class ErrorMapper {
  toDiscordPayload(error) {
    if (error instanceof InvalidTickerError) {
      return {
        content: 'Ticker inválido.',
        flags: MessageFlags.Ephemeral,
      };
    }

    if (error instanceof NotFoundError) {
      return {
        content: 'Nao encontrei dados para o ticker informado.',
        flags: MessageFlags.Ephemeral,
      };
    }

    if (error instanceof PermissionDeniedError) {
      return {
        content: 'Este comando ainda está em fase de testes.',
        flags: MessageFlags.Ephemeral,
      };
    }

    if (error instanceof RateLimitError) {
      return {
        content: 'A fonte de dados atingiu o limite de consultas. Tente novamente mais tarde.',
        flags: MessageFlags.Ephemeral,
      };
    }

    if (error instanceof TemporaryDataSourceError) {
      return {
        content: 'A fonte de dados esta indisponivel no momento. Tente novamente em instantes.',
        flags: MessageFlags.Ephemeral,
      };
    }

    if (error instanceof AccessDeniedError) {
      return {
        content: 'Nao foi possivel acessar os dados deste ativo na fonte atual.',
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

    if (error instanceof FundamentalDataUnavailableError || error instanceof ValidationError) {
      return {
        content: 'Dados ausentes para concluir a analise deste ticker.',
        flags: MessageFlags.Ephemeral,
      };
    }

    return {
      content: 'Nao foi possivel concluir a analise agora.',
      flags: MessageFlags.Ephemeral,
    };
  }
}

module.exports = {
  ErrorMapper,
};
