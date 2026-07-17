const fs = require('node:fs/promises');
const { DataSourceError } = require('../errors/dataSourceError');

async function readJsonFile(filePath) {
  try {
    const fileContent = await fs.readFile(filePath, 'utf8');
    return JSON.parse(fileContent);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new DataSourceError(`Invalid JSON content in file: ${filePath}`, { cause: error });
    }

    if (error && error.code === 'ENOENT') {
      throw new DataSourceError(`JSON file not found: ${filePath}`, { cause: error });
    }

    throw new DataSourceError(`Unable to read JSON file: ${filePath}`, { cause: error });
  }
}

module.exports = {
  readJsonFile,
};
