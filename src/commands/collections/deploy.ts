import { Message } from 'discord.js';
import { schema } from '@/commands/schema';

export const deploy = async (message: Message): Promise<void> => {
  try {
    await message?.guild?.commands.set(schema);
    await message.reply('Deployed!');
  } catch (e) {
    message.reply('Fail to deploy!');
  }
};
