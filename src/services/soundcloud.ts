import { Platform } from '@/enums';
import {
  IMusicService,
  IPlaylist,
  ISong
} from '@/types';
import {
  soundCloudPlaylistRegex,
  soundCloudTrackRegex
} from '@/constants/regex'
import {
  SOUNDCLOUD_CLIENT_ID,
  SOUNDCLOUD_OAUTH_TOKEN
} from '@/constants/config';
import messages from '@/constants/messages';
import { Soundcloud, SoundcloudTrack } from 'soundcloud.ts';
import { createAudioResource, AudioResource, StreamType } from '@discordjs/voice';

export class SoundCloudService implements IMusicService {
  private soundcloud: Soundcloud = new Soundcloud(SOUNDCLOUD_CLIENT_ID, SOUNDCLOUD_OAUTH_TOKEN);

  public async createAudioResource(song: ISong): Promise<AudioResource> {
    const stream = await this.soundcloud.util.streamTrack(song.url);
    return createAudioResource(stream, { inputType: StreamType.Arbitrary });
  }

  public async getPlaylistAsync(url: string): Promise<IPlaylist> {
    const result = await this.soundcloud.playlists.getAlt(url);
    if (result.tracks.length === 0) throw new Error(messages.playlistNotFound);

    const songs: ISong[] = result.tracks.map((item: SoundcloudTrack) => (
      <ISong>{
        id: this.getTrackId(item.permalink_url) ?? item.permalink_url,
        title: item.title,
        duration: item.duration / 1000,
        author: item.user.full_name,
        thumbnail: item.artwork_url,
        url: item.permalink_url,
        platform: Platform.SOUNDCLOUD
      }
    ));
    return <IPlaylist>{
      id: this.getPlaylistId(result.permalink_url) ?? result.permalink_url,
      title: result.title,
      thumbnail: result.artwork_url ?? songs.at(0)?.thumbnail ?? '',
      author: result.user.full_name,
      songs
    };
  }

  public async getSongAsync(url: string): Promise<ISong> {
    const result = await this.soundcloud.tracks.get(url);
    if (!result) throw new Error(messages.songNotFound);

    const song: ISong = {
      id: this.getTrackId(result.permalink_url) ?? result.permalink_url,
      title: result.title,
      duration: result.duration / 1000,
      author: result.user.full_name,
      thumbnail: result.artwork_url,
      url: result.permalink_url,
      platform: Platform.SOUNDCLOUD
    };
    return song;
  }

  public async searchAsync(query: string): Promise<ISong> {
    const result = await this.soundcloud.tracks.search({ q: query, limit: 1 });
    if (result.collection.length === 0) throw new Error(`${messages.searchNotFound} ${query}`);

    const track = result.collection.at(0);
    if (!track) throw new Error(`${messages.searchNotFound} ${query}`);

    const song: ISong = {
      id: this.getTrackId(track.permalink_url) ?? track.permalink_url,
      title: track.title,
      duration: track.duration / 1000,
      author: track.user.full_name,
      thumbnail: track.artwork_url,
      url: track.permalink_url,
      platform: Platform.SOUNDCLOUD
    };
    return song;
  }

  private getPlaylistId(url: string): string | null | undefined {
    const match = url.match(soundCloudPlaylistRegex);
    return match ? `${match[2]}/sets/${match[3]}` : null;
  }

  private getTrackId(url: string): string | null | undefined {
    return url.match(soundCloudTrackRegex)?.[2];
  }
}
