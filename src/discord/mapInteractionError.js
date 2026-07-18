const { ErrorMapper } = require('../errors/errorMapper');

function mapInteractionError(error) {
  return new ErrorMapper().toDiscordPayload(error);
}

module.exports = {
  mapInteractionError,
};
