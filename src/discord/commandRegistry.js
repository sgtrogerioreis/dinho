const { createGrahamCommand } = require('../commands/graham');

function createCommandRegistry(dependencies) {
  const grahamCommand = createGrahamCommand(dependencies);

  return new Map([[grahamCommand.data.name, grahamCommand]]);
}

function getCommandDefinitions() {
  const { grahamCommandData } = require('../commands/grahamDefinition');

  return [grahamCommandData.toJSON()];
}

module.exports = {
  createCommandRegistry,
  getCommandDefinitions,
};
