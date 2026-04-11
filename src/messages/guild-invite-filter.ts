import { Client, Message } from 'discord.js';
import { discordInviteRegex, discordInviteShortRegex } from '@/constants/regex';
import messages from '@/constants/messages';

function linkCheck(message: string): string | null {
  let match = message.match(discordInviteShortRegex);
  if (match) {
    return match[1];
  }
  match = message.match(discordInviteRegex);
  if (match) {
    return match[1];
  }
  return null;
}

export const guildInviteFilter = async (client: Client, message: Message): Promise<void> => {
  try {
    const inviteCode = linkCheck(message.content);
    if (!inviteCode) {
      return;
    }
    const invite = await client.fetchInvite(inviteCode);
    if (invite && invite.guild?.id === message.guild?.id) {
      return;
    } else {
      message.reply(messages.inviteBlockMessage);
      setTimeout(() => {
        message.delete();
      }, 1000);
    }
  } catch (error) {
    console.error(`Guild invite filter error: ${error}`);
  }
};
