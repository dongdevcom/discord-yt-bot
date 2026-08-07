import { Client, ChatInputCommandInteraction, TextChannel } from 'discord.js';
import messages from '@/constants/messages';

export const wipe = {
  name: 'wipe',
  execute: async (interaction: ChatInputCommandInteraction, client: Client): Promise<void> => {
    const channel = interaction.channel;

    if (!channel || channel.isSendable() === false) {
      await interaction.reply(messages.error);
      return;
    }
    if (interaction.user.id !== interaction.guild?.ownerId) {
      await interaction.reply(messages.permissionError);
      return;
    }

    await interaction.reply(messages.processing);

    let deleted = 0;
    let lastId: string | undefined;
    while (true) {
      const messages: any = await channel.messages.fetch({
        limit: 100,
        before: lastId,
      });

      if (!messages || messages.size === 0) break;

      for (const message of messages.values()) {
        if (channel.lastMessageId === message.id) continue;
        if (!message.interactionMetadata) continue;

        try {
          await message.delete();
          deleted++;
        } catch {}
      }

      lastId = messages.last()?.id;

      if (messages.size < 100) break;
    }

    await channel.send(messages.bulkDeleteMessages(deleted));
  },
};
