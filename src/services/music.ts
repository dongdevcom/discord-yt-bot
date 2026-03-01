import {
  youtubePlaylistRegex,
  youtubeVideoRegex,
  soundCloudPlaylistRegex,
  soundCloudTrackRegex
} from '@/constants/regex'
import { IPlaylist, ISong, IMusicService } from '@/types';
import { Platform, MediaType } from '@/enums';
import { YoutubeService } from '@/services/youtube';
import { SoundCloudService } from '@/services/soundcloud';
import {  AudioResource } from '@discordjs/voice';

export class MusicService {
  private youtube: YoutubeService | null | undefined;
  private soundcloud: SoundCloudService | null | undefined;

  constructor(
    youtube: YoutubeService | null | undefined,
    soundcloud: SoundCloudService | null | undefined
  ) {
    this.youtube = youtube;
    this.soundcloud = soundcloud;
  }

  public createAudioResource(song: ISong): Promise<AudioResource> {
    const plugin = this.getPluginByPlatform(song.platform);
    return plugin.createAudioResource(song);
  }

  public async getAsync(query: string, platform: Platform = Platform.YOUTUBE): Promise<IPlaylist | ISong> {
    const types = this.detectMediaTypes(query);
    const plugin = this.getPluginByMediaType(types, platform);

    // try to get as playlist first
    if (this.hasType(types, [MediaType.SoundCloudPlaylist, MediaType.YouTubePlaylist])) {
      try {
        return await plugin.getPlaylistAsync(query);
      } catch (e) {
        // maybe it's a private playlist link, try to get as a song
        if (this.hasType(types, [MediaType.SoundCloudTrack, MediaType.YouTubeVideo])) {
          return await plugin.getSongAsync(query);
        }
        throw e;
      }
    }
    if (this.hasType(types, [MediaType.SoundCloudTrack, MediaType.YouTubeVideo])) {
      return await plugin.getSongAsync(query);
    }
    return await plugin.searchAsync(query);
  }

  private getPluginByPlatform(platform: Platform): IMusicService {
    let plugin = null;
    switch (platform) {
      case Platform.SOUNDCLOUD:
        plugin = this.soundcloud;
        break;
      case Platform.YOUTUBE:
      default:
        plugin = this.youtube;
    }
    if (!plugin) {
      throw new Error(`Plugin for platform ${platform} not initialized`);
    }
    return plugin;
  }

  private getPluginByMediaType(types: MediaType[], platform: Platform = Platform.YOUTUBE): IMusicService {
    let plugin = null;
    if (this.hasType(types, [MediaType.SoundCloudPlaylist, MediaType.SoundCloudTrack])) {
      plugin = this.soundcloud;
    }
    if (this.hasType(types, [MediaType.YouTubePlaylist, MediaType.YouTubeVideo])) {
      plugin = this.youtube;
    }
    return plugin ?? this.getPluginByPlatform(platform);
  }

  private detectMediaTypes(url: string): MediaType[] {
    const result: MediaType[] = [];
    if (youtubePlaylistRegex.test(url)) {
      result.push(MediaType.YouTubePlaylist);
    }
    if (youtubeVideoRegex.test(url)) {
      result.push(MediaType.YouTubeVideo);
    }
    if (soundCloudPlaylistRegex.test(url)) {
      result.push(MediaType.SoundCloudPlaylist);
    }
    if (soundCloudTrackRegex.test(url)) {
      result.push(MediaType.SoundCloudTrack);
    }
    return result;
  }

  private hasType(type: MediaType[], targets: MediaType[]): boolean {
    for (const t of targets) {
      if (type.indexOf(t) > -1) {
        return true;
      }
    }
    return false;
  }
}
