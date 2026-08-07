import messages from '@/constants/messages';
import { Client } from 'discord.js';
import {
  help,
  jump,
  leave,
  nowPlaying,
  pause,
  ping,
  play,
  queue,
  remove,
  resume,
  shuffle,
  skip,
  wipe
} from '@/commands/collections';

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
          ping.execute(interaction, client);
          break;
        case remove.name:
          remove.execute(interaction);
          break;
        case shuffle.name:
          shuffle.execute(interaction);
          break;
        case wipe.name:
          wipe.execute(interaction, client);
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
