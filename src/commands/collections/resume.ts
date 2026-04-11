import messages from '@/constants/messages';
import { servers } from '@/servers';
import { AudioPlayerStatus } from '@discordjs/voice';
import { ChatInputCommandInteraction } from 'discord.js';

export const resume = {
  name: 'resume',
  execute: async (interaction: ChatInputCommandInteraction): Promise<void> => {
    await interaction.deferReply();
    const server = servers.get(interaction.guildId as string);
    if (!server) {
      await interaction.followUp(messages.joinVoiceChannel);
      return;
    }
    if (server.audioPlayer.state.status === AudioPlayerStatus.Paused) {
      server.resume();
      await interaction.followUp(messages.resumed);
      return;
    }
    await interaction.followUp(messages.notPlaying);
  },
};
