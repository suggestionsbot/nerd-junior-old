import { Client, Interaction } from 'discord.js';
import { Listener } from '../types';

export const listener: Listener = {
  name: 'interactionCreate',
  async execute(client: Client, interaction: Interaction): Promise<any> {
    if (!interaction.isCommand()) return;
    if (!client.commands.has(interaction.commandName)) return;

    try {
      await client.commands.get(interaction.commandName).execute(interaction);
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: 'An error occurred while executing this command!', ephemeral: true });
    }
  }
};
