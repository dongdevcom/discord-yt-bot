import messages from '@/constants/messages';
import { Client, ChatInputCommandInteraction } from 'discord.js';

export const ping = {
  name: 'ping',
  execute: async (
    interaction: ChatInputCommandInteraction,
    client: Client
  ): Promise<void> => {
    await interaction.deferReply();
    interaction.followUp(
      `${messages.ping} - Latency: ${Math.round(
        Date.now() - interaction.createdTimestamp,
      )}ms - API Latency: ${Math.round(client.ws.ping)}ms`,
    );
  },
};
