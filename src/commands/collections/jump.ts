import messages from '@/constants/messages';
import { servers } from '@/servers';
import { ChatInputCommandInteraction } from 'discord.js';

export const jump = {
  name: 'jump',
  execute: async (interaction: ChatInputCommandInteraction): Promise<void> => {
    await interaction.deferReply();
    const server = servers.get(interaction.guildId as string);
    if (!server) {
      await interaction.followUp(messages.joinVoiceChannel);
      return;
    }
    const input = interaction.options.getNumber('position');
    if (input === null || input < 1 || input > server.queue.length || !Number.isInteger(input)) {
      await interaction.followUp(messages.invalidPosition);
      return;
    }
    const target = await server.jump(input);
    await interaction.followUp(`${messages.jumpedTo} ${target.song.title}`);
  },
};
