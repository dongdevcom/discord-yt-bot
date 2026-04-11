import messages from '@/constants/messages';
import { servers } from '@/servers';
import { ChatInputCommandInteraction } from 'discord.js';

export const shuffle = {
  name: 'shuffle',
  execute: async (interaction: ChatInputCommandInteraction): Promise<void> => {
    await interaction.deferReply();
    const server = servers.get(interaction.guildId as string);
    if (!server) {
      await interaction.followUp(messages.joinVoiceChannel);
      return;
    }
    if (server.queue.length === 0) {
      await interaction.followUp(messages.noSongsInQueue);
      return;
    }
    server.shuffle();
    await interaction.followUp(messages.shuffled);
  },
};
