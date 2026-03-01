import messages from '@/constants/messages';
import { Server } from '@/services';
import { servers } from '@/servers';
import { IPlaylist, IQueueItem, ISong } from '@/types';
import { Platform, ItemType } from '@/enums';
import {
  entersState,
  joinVoiceChannel,
  VoiceConnectionStatus,
} from '@discordjs/voice';
import { ChatInputCommandInteraction, GuildMember, Client } from 'discord.js';
import { createPlayMessage } from '@/commands/messages/playMessage';

export const play = {
  name: 'play',
  execute: async (interaction: ChatInputCommandInteraction, client: Client): Promise<void> => {
    await interaction.deferReply();
    let server = servers.get(interaction.guildId as string);
    if (!server) {
      if (
        interaction.member instanceof GuildMember &&
        interaction.member.voice.channel
      ) {
        const channel = interaction.member.voice.channel;
        server = new Server(
          joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator,
          }),
          interaction.guildId as string
        );
        servers.set(interaction.guildId as string, server);
      }
    }

    if (!server) {
      await interaction.followUp(messages.joinVoiceChannel);
      return;
    }

    // Make sure the connection is ready before processing the user's request
    try {
      await entersState(
        server.voiceConnection,
        VoiceConnectionStatus.Ready,
        20e3,
      );
    } catch (error) {
      await interaction.followUp(messages.failToJoinVoiceChannel);
      return;
    }

    try {
      const input = interaction.options.get('input')!.value! as string;
      const inputPlatform = interaction.options.get('platform')?.value as string | undefined;
      const normalizedPlatform = inputPlatform?.toUpperCase() as keyof typeof Platform;
      const platform = Platform[normalizedPlatform] ?? Platform.YOUTUBE;

      const service = await server.getMusicService();
      const result = await service.getAsync(input, platform);
      const requester = interaction.member?.user.username ?? '';

      let payload: any = { platform, requester };
      let items: IQueueItem[];

      if ('songs' in result) {
        const { title, author, thumbnail, songs } = result as IPlaylist;
        items = songs.map(song => ({ song, requester }));
        Object.assign(payload, {
          title,
          url: input,
          author,
          thumbnail,
          length: songs.length,
          type: ItemType.PLAYLIST
        });
      } else {
        const { title, url, author, thumbnail, duration, platform } = result as ISong;
        items = [{ song: result as ISong, requester: interaction.member?.user.username ?? '' }];
        Object.assign(payload, {
          title,
          url,
          author,
          thumbnail,
          length: duration,
          type: platform === Platform.YOUTUBE ? ItemType.VIDEO : ItemType.TRACK
        });
      }

      await server.addSongs(items);
      interaction.followUp({
        embeds: [
          createPlayMessage(payload),
        ],
      });
    } catch (error: any) {
      console.error(error);
      const message = error?.message || 'Unknown error';
      await interaction.followUp(`${messages.failToPlay} ${message}`);
    }
  },
};
