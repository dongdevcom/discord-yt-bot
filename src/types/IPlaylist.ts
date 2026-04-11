import { ISong } from '@/types';

export interface IPlaylist {
  id: string;
  title: string;
  thumbnail: string;
  author: string;
  songs: ISong[];
}
