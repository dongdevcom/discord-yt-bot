import { MESSAGE_EMBED_COLOR } from '@/constants/config';
import messages from '@/constants/messages';
import { IQueueItem } from '@/types';
import { formatSeconds } from '@/utils';
import { EmbedBuilder, Embed } from 'discord.js';

const MAX_SONGS_PER_PAGE = 10;

const generatePageMessage = (items: IQueueItem[], start: number) => {
  const embedMessage = new EmbedBuilder({
    title: messages.yourQueue,
    fields: items.map((item, index) => ({
      name: `${start + 1 + index}. ${item.song.title} | ${item.song.author}`,
      value: `${formatSeconds(item.song.duration)} | ${item.song.platform} | ${messages.addedToQueue} ${item.requester}`,
    })),
    color: MESSAGE_EMBED_COLOR,
  });
  return embedMessage.data as Embed;
};

export const createQueueMessages = (queue: IQueueItem[]): Embed[] => {
  if (queue.length < MAX_SONGS_PER_PAGE) {
    const embedMessage = generatePageMessage(queue, 0);
    return [embedMessage];
  } else {
    const embedMessages = [];
    for (let i = 0; i < queue.length; i += MAX_SONGS_PER_PAGE) {
      const items = generatePageMessage(queue.slice(i, i + MAX_SONGS_PER_PAGE), i,);
      embedMessages.push(items);
    }
    return embedMessages;
  }
};
