import {
  BOT_LOGO,
  BOT_NAME,
  MESSAGE_EMBED_COLOR,
  PLATFORM,
} from '@/constants/config';
import messages from '@/constants/messages';
import { Platform, ItemType } from '@/enums';
import { formatSeconds } from '@/utils';
import { APIEmbedField, EmbedBuilder } from 'discord.js';

export const createPlayMessage = (payload: {
  title: string;
  url: string;
  author: string;
  thumbnail: string;
  type: ItemType;
  length: number;
  platform: Platform;
  requester: string;
}): EmbedBuilder => {
  const fields: APIEmbedField[] = [];
  
  if (payload.author) {
    const author: APIEmbedField = {
      name: messages.author,
      value: payload.author,
      inline: true,
    };
    fields.push(author);
  }
  
  const length: APIEmbedField = {
    name: payload.type === ItemType.PLAYLIST ? messages.length : messages.duration,
    value: payload.type === ItemType.PLAYLIST ? payload.length.toString() : formatSeconds(payload.length),
    inline: true,
  };
  const type: APIEmbedField = {
    name: messages.type,
    value: payload.type,
    inline: true,
  };
  fields.push(length);
  fields.push(type);

  return new EmbedBuilder()
    .setColor(MESSAGE_EMBED_COLOR)
    .setTitle(payload.title)
    .setURL(payload.url)
    .setAuthor({
      name: `${messages.addedToQueue} ${payload.requester}`,
      url: PLATFORM[payload.platform].uri
    })
    .setThumbnail(payload.thumbnail)
    .addFields(fields)
    .setFooter({ text: BOT_NAME, iconURL: BOT_LOGO });
};
