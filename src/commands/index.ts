import messages from '@/constants/messages';
import { Client } from 'discord.js';
import { help } from '@/commands/collections/help';
import { jump } from '@/commands/collections/jump';
import { leave } from '@/commands/collections/leave';
import { nowPlaying } from '@/commands/collections/nowplaying';
import { pause } from '@/commands/collections/pause';
import { ping } from '@/commands/collections/ping';
import { play } from '@/commands/collections/play';
import { queue } from '@/commands/collections/queue';
import { remove } from '@/commands/collections/remove';
import { resume } from '@/commands/collections/resume';
import { shuffle } from '@/commands/collections/shuffle';
import { skip } from '@/commands/collections/skip';

export const run = (client: Client): void => {
  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand() || !interaction.guildId) return;
    
    try {
      switch (interaction.commandName) {
        case play.name:
          play.execute(interaction, client);
          break;
        case skip.name:
          skip.execute(interaction);
          break;
        case pause.name:
          pause.execute(interaction);
          break;
        case resume.name:
          resume.execute(interaction);
          break;
        case leave.name:
          leave.execute(interaction);
          break;
        case nowPlaying.name:
          nowPlaying.execute(interaction);
          break;
        case queue.name:
          queue.execute(interaction);
          break;
        case jump.name:
          jump.execute(interaction);
          break;
        case ping.name:
          ping.execute(client, interaction);
          break;
        case remove.name:
          remove.execute(interaction);
          break;
        case shuffle.name:
          shuffle.execute(interaction);
          break;
        case help.name:
          help.execute(interaction);
          break;
      }
    } catch (e) {
      interaction.reply(messages.error);
    }
  });
};
