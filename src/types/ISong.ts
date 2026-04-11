import { Platform } from '@/enums';

export interface ISong {
  id: string;
  title: string;
  duration: number;
  author: string;
  thumbnail: string;
  url: string;
  platform: Platform;
}
