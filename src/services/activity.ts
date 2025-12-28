import { Client, ActivityType, ChannelType, ActivityOptions } from 'discord.js';
import { servers } from '@/servers';
import { LunarFestival } from '@/enums';
import { isSameDay, isBeetweenDates } from '@/utils';
import messages from '@/constants/messages';

export class ActivitySerivce {
  private client: Client;
  private interval: number = 30_000;
  private lunarFestivals = {
    [LunarFestival.NewYear]: [
      { start: new Date(2026, 1, 7), end: new Date(2026, 2, 3), date: new Date(2026, 1, 17) },
      { start: new Date(2027, 0, 27), end: new Date(2027, 1, 20), date: new Date(2027, 1, 6) },
      { start: new Date(2028, 0, 16), end: new Date(2028, 1, 9), date: new Date(2028, 0, 26) },
      { start: new Date(2029, 1, 3), end: new Date(2029, 1, 27), date: new Date(2029, 1, 13) },
      { start: new Date(2030, 0, 23), end: new Date(2030, 1, 16), date: new Date(2030, 1, 2) },
      { start: new Date(2031, 0, 13), end: new Date(2031, 1, 6), date: new Date(2031, 0, 23) },
      { start: new Date(2032, 1, 1), end: new Date(2032, 1, 25), date: new Date(2032, 1, 11) },
      { start: new Date(2033, 0, 20), end: new Date(2033, 1, 14), date: new Date(2033, 0, 31) },
      { start: new Date(2034, 1, 8), end: new Date(2034, 2, 5), date: new Date(2034, 1, 19) },
      { start: new Date(2035, 0, 28), end: new Date(2035, 1, 22), date: new Date(2035, 1, 8) }
    ],
    [LunarFestival.MidAutumn]: [
      new Date(2026, 8, 25),
      new Date(2027, 8, 15),
      new Date(2028, 9, 3),
      new Date(2029, 8, 22),
      new Date(2030, 8, 12),
      new Date(2031, 9, 1),
      new Date(2032, 8, 19),
      new Date(2033, 8, 8),
      new Date(2034, 8, 26),
      new Date(2035, 8, 16),
    ]
  };

  constructor(client: Client) {
    this.client = client;
  }

  async startRotation() {
    const activities = async (): Promise<ActivityOptions[]> => {
      const baseActivities: ActivityOptions[] = [
        {
          name: messages.activityHelp,
          type: ActivityType.Custom,

        },
        {
          name: messages.activityServerCount(this.getPlayingServerCount()),
          type: ActivityType.Playing,
        },
        {
          name: messages.activityTotalListeners(await this.getTotalListeners()),
          type: ActivityType.Listening,
        },
        {
          name: this.getTimeOfDay(),
          type: ActivityType.Custom
        },
        {
          name: this.getSeason(),
          type: ActivityType.Custom
        }
      ];

      const specialEvent = this.getSpecialEvent();
      const lunarFestivals = this.getLunarFestival();
      if (specialEvent) {
        baseActivities.unshift({ name: specialEvent, type: ActivityType.Custom });
      }
      if (lunarFestivals) {
        baseActivities.unshift({ name: lunarFestivals, type: ActivityType.Custom });
      }
      return baseActivities;
    };

    setInterval(async () => {
      const list = await activities();
      const randomIndex = Math.floor(Math.random() * list.length);
      this.client.user?.setActivity(list[randomIndex]);
    }, this.interval);
  }

  private getPlayingServerCount(): number {
    return servers?.size ?? 0;
  }

  private async getTotalListeners(): Promise<number> {
    let total = 0;
    for (const srv of servers?.values()) {
      const guild = await this.client.guilds.fetch(srv.guildId);
      if (!guild) {
        continue;
      }

      const channelId = srv.voiceConnection.joinConfig.channelId;
      const voiceChannel = guild.channels.cache.get(channelId as string);

      if (voiceChannel && voiceChannel.type === ChannelType.GuildVoice) {
        total += voiceChannel.members.size;
      }
    }
    return total;
  }

  private getSpecialEvent(): string | null {
    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();

    if (month === 2 && day === 14) return messages.activityValentine;
    if (month === 10 && day === 31) return messages.activityHalloween;
    if (month === 12 && day >= 20 && day <= 31) return messages.activityChristmas;
    if (month === 1 && day <= 7) return messages.activityNewYear;
    return null;
  }

  private getTimeOfDay(): string {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return messages.activityMorning;
    if (hour >= 12 && hour < 17) return messages.activityAfternoon;
    if (hour >= 17 && hour < 21) return messages.activityEvening;
    return messages.activityNight;
  }

  private getSeason(): string {
    const month = new Date().getMonth() + 1;
    if ([3, 4, 5].includes(month)) return messages.activitySpring;
    if ([6, 7, 8].includes(month)) return messages.activitySummer;
    if ([9, 10, 11].includes(month)) return messages.activityAutumn;
    return messages.activityWinter;
  }

  private getLunarFestival(): string | null {
    const now = new Date();
    const midAutumn = this.lunarFestivals[LunarFestival.MidAutumn].find(date => {
      return isSameDay(now, date);
    });
    const newYear = this.lunarFestivals[LunarFestival.NewYear].find(p => {
      return isBeetweenDates(now, p.start, p.end);
    });
    if (midAutumn) return messages.activityLunarMidAutumn;
    if (newYear) return messages.activityLunarNewYear;
    return null;
  }
}