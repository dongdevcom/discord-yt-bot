import { IPlaylist, ISong } from '@/types';
import {  AudioResource } from '@discordjs/voice';

export interface IMusicService {
  createAudioResource: (song: ISong) => Promise<AudioResource>;
  getPlaylistAsync: (url: string) => Promise<IPlaylist>;
  getSongAsync: (url: string) => Promise<ISong>;
  searchAsync: (query: string) => Promise<ISong>;
}
