import { promises as fs } from 'fs';
import { YOUTUBE_COOKIE_PATH } from '@/constants/config';

export const getCookie = async (): Promise<string> => {
  const cookie = await fs.readFile(YOUTUBE_COOKIE_PATH, 'utf8');
  return cookie;
}