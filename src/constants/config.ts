import { Colors } from 'discord.js';
import { Platform } from '@/enums';
import * as path from 'path';

export const BOT_TOKEN = process.env.BOT_TOKEN;
export const BOT_LANG = process.env.BOT_LANG ?? 'en';
export const REDIS_URL = process.env.REDIS_URL;
export const SOUNDCLOUD_CLIENT_ID = process.env.SOUNDCLOUD_CLIENT_ID;
export const SOUNDCLOUD_OAUTH_TOKEN = process.env.SOUNDCLOUD_OAUTH_TOKEN;
export const CMD_PREFLIX = '/';
export const MESSAGE_EMBED_COLOR = Colors.Red;

export const SOUNDCLOUD_LOGO = 'https://dongdev.com/images/soundcloud.png';
export const YOUTUBE_LOGO = 'https://dongdev.com/images/youtube.png';
export const PLATFORM = {
  [Platform.YOUTUBE]: {
    uri: YOUTUBE_LOGO,
    name: 'Youtube',
  },
  [Platform.SOUNDCLOUD]: {
    uri: SOUNDCLOUD_LOGO,
    name: 'SoundCloud',
  },
};
export const BOT_NAME = 'DongDev Bot';
export const BOT_LOGO = 'https://dongdev.com/images/favicon.png';
export const YOUTUBE_COOKIE_PATH = path.join(process.cwd(), 'cookie.txt');
