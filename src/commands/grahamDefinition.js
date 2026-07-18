const { SlashCommandBuilder } = require('discord.js');

const grahamCommandData = new SlashCommandBuilder()
  .setName('graham')
  .setDescription('Calcula o preço justo de uma ação pelo método de Graham.')
  .addStringOption((option) =>
    option
      .setName('ticker')
      .setDescription('Ticker da ação brasileira, como PETR4.')
      .setRequired(true),
  );

module.exports = {
  grahamCommandData,
};
