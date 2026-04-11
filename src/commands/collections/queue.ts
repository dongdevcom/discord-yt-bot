import messages from '@/constants/messages';
import { servers } from '@/servers';
import { ChatInputCommandInteraction } from 'discord.js';
import { Pagination } from 'pagination.djs';
import { createQueueMessages } from '@/commands/messages/queueMessage';

export const queue = {
  name: 'queue',
  execute: async (interaction: ChatInputCommandInteraction): Promise<void> => {
    await interaction.deferReply();
    const server = servers.get(interaction.guildId as string);
    if (!server) {
      await interaction.followUp(messages.joinVoiceChannel);
      return;
    }
    if (server.queue.length === 0) {
      await interaction.followUp(messages.nothing);
      return;
    }

    const embedMessages = createQueueMessages(server.queue);
    await interaction.editReply(messages.yourQueue);

    if (interaction && interaction.channel) {
      const pagination = new Pagination(interaction as ChatInputCommandInteraction);

      pagination.setEmbeds(embedMessages);
      // or if you want to set a common change in all embeds, you can do it by adding a cb.
      pagination.setEmbeds(embedMessages, (embed, index, array) => {
          return embed.setFooter({ text: `Page: ${index + 1}/${array.length}` });
      });
      pagination.render();
    }
  },
};
