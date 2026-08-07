import { Client, GatewayIntentBits } from 'discord.js';
import { generateDependencyReport } from '@discordjs/voice';
import { BOT_TOKEN } from '@/constants/config';
import { run } from '@/commands';
import { messageEvent } from '@/messages';
import { ActivitySerivce } from '@/services';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
  ]
});

client.on('clientReady', () => {
  console.log(generateDependencyReport());
  console.log('🏃‍♂️ Bot is online! 💨');

  const activityService = new ActivitySerivce(client);
  activityService.startRotation();
});

client.once('reconnecting', () => {
  console.log('🔗 Reconnecting!');
});

client.once('disconnect', () => {
  console.log('🛑 Disconnect!');
});

(async () => {
  try {
    await client.login(BOT_TOKEN);
    messageEvent(client);
    run(client);
  } catch (e: any) {
    console.error('Error:', e.stack);
  }
})();
