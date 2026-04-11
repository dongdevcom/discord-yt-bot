import { ChatInputCommandInteraction } from 'discord.js';
import { createHelpMessage } from '@/commands/messages/helpMessage';

export const help = {
  name: 'help',
  execute: async (interaction: ChatInputCommandInteraction): Promise<void> => {
    await interaction.deferReply();
    await interaction.followUp({
      embeds: [createHelpMessage()],
    });
  },
};
