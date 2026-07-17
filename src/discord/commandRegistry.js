const { createGrahamCommand, grahamCommandData } = require('../commands/graham');

function createCommandRegistry(dependencies) {
  const grahamCommand = createGrahamCommand(dependencies);

  return new Map([[grahamCommand.data.name, grahamCommand]]);
}

function getCommandDefinitions() {
  return [grahamCommandData.toJSON()];
}

module.exports = {
  createCommandRegistry,
  getCommandDefinitions,
};
