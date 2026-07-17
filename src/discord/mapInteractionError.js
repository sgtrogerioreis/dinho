const { MessageFlags } = require('discord.js');
const { ConfigurationError } = require('../errors/configurationError');
const { InvalidTickerError } = require('../errors/invalidTickerError');
const { NotFoundError } = require('../errors/notFoundError');
const { ValidationError } = require('../errors/validationError');

function mapInteractionError(error) {
  if (error instanceof NotFoundError) {
    return {
      content: 'Não encontrei dados para o ticker informado.',
    };
  }

  if (error instanceof InvalidTickerError) {
    return {
      content: 'Informe um ticker válido, como PETR4.',
    };
  }

  if (error instanceof ValidationError) {
    return {
      content: 'Não há dados suficientes para calcular Graham para este ticker.',
    };
  }

  if (error instanceof ConfigurationError) {
    return {
      content: 'O DINHO não está configurado corretamente no momento.',
      flags: MessageFlags.Ephemeral,
    };
  }

  return {
    content: 'Não foi possível concluir o cálculo agora.',
    flags: MessageFlags.Ephemeral,
  };
}

module.exports = {
  mapInteractionError,
};
