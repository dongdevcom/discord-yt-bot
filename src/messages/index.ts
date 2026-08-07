import { Client, Message } from 'discord.js';
import { deploy } from '@/commands/collections/deploy';
import { CMD_PREFLIX } from '@/constants/config';
import { guildInviteFilter } from './guild-invite-filter';

export const messageEvent = (client: Client): void => {
  client.on('messageCreate', async (message: Message) => {
    if (!message.guild) return;
    if (message.author.bot) return;
    // deploy bot commands
    if (
      message.content.toLowerCase() === CMD_PREFLIX + 'deploy' &&
      message.author.id === message.guild.ownerId
    ) {
      await deploy(message);
      return;
    }
    if (message.author.id !== message.guild.ownerId) {
      guildInviteFilter(client, message);
    }
  });
};
