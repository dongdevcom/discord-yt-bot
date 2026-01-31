import { Readable } from 'node:stream';
import type { ReadableStream as NodeReadableStream } from 'node:stream/web';
import {
  Innertube,
  UniversalCache,
  Platform as InnertubePlatform,
  Types
} from 'youtubei.js';
import type { SabrPlaybackOptions } from 'googlevideo/sabr-stream';
import { EnabledTrackTypes } from 'googlevideo/utils';
import { createAudioResource, AudioResource } from '@discordjs/voice';
import { Platform } from '@/enums';
import {
  IMusicService,
  IPlaylist,
  IPlaylistCache,
  ISong
} from '@/types';
import { youtubePlaylistRegex, youtubeVideoRegex } from '@/constants/regex'
import { CacheSerivce, RedisService } from '@/services'
import messages from '@/constants/messages';
import {
  timeStringToSeconds,
  getCookie,
  detectAudioFormat,
  createSabrStream
} from '@/utils';


export class YoutubeService implements IMusicService {
  private innertube: Innertube | null | undefined;
  private redis: RedisService = new RedisService();
  private songCache: CacheSerivce = new CacheSerivce('yt:song', 24 * 60);
  private playlistCache: CacheSerivce = new CacheSerivce('yt:playlist', 24 * 60);

  private async createInnerTubeAsync(): Promise<Innertube> {
    if (!this.innertube) {
      const cookie = await getCookie();

      InnertubePlatform.shim.eval = async (data: Types.BuildScriptResult, env: Record<string, Types.VMPrimative>) => {
        const properties = [];
        if (env.n) {
          properties.push(`n: exportedVars.nFunction("${env.n}")`)
        }
        if (env.sig) {
          properties.push(`sig: exportedVars.sigFunction("${env.sig}")`)
        }
        const code = `${data.output}\nreturn { ${properties.join(', ')} }`;
        return new Function(code)();
      };

      this.innertube = await Innertube.create({
        cookie,
        cache: new UniversalCache(true)
      });
    }
    return this.innertube;
  }

  public async createAudioResource(song: ISong): Promise<AudioResource> {
    const options: SabrPlaybackOptions = {
      preferWebM: true,
      preferOpus: true,
      audioQuality: 'AUDIO_QUALITY_MEDIUM',
      enabledTrackTypes: EnabledTrackTypes.AUDIO_ONLY
    };

    const innertube = await this.createInnerTubeAsync();
    const { streamResults } = await createSabrStream(innertube, song.id, options);
    const { audioStream, selectedFormats } = streamResults;

    const nodeReadable = Readable.fromWeb(audioStream as NodeReadableStream);
    const inputType = detectAudioFormat(selectedFormats?.audioFormat?.mimeType);
    return createAudioResource(nodeReadable, { inputType });
  }

  public async getPlaylistAsync(url: string): Promise<IPlaylist> {
    const playlistId = this.getPlaylistId(url) || url;
    const cached = await this.redis.getAsync(this.playlistCache.key(playlistId));
    if (cached) return await this.getPlaylistFromCacheAsync(cached as IPlaylistCache);

    const innertube = await this.createInnerTubeAsync();
    let response = await innertube.getPlaylist(playlistId);
    if (!response) throw new Error(messages.playlistNotFound);

    const playlist: IPlaylistCache = {
      id: playlistId,
      title: response.info.title!,
      thumbnail: response.info.thumbnails?.at(0)?.url!,
      author: response.info.author.name!,
      ids: []
    };
    let continuation = false;

    do {
      const songs: ISong[] = response.items.map((item: any) => (
        <ISong>{
          id: item.id,
          title: item.title.text,
          duration: item.duration.seconds,
          author: item.author.name,
          thumbnail: item.thumbnails.at(0).url,
          url: this.getUrlFromId(item.id),
          platform: Platform.YOUTUBE
        }
      ));
      for (const song of songs) {
        playlist.ids.push(song.id);
        await this.redis.setAsync(this.songCache.key(song.id), song, this.songCache.ttl());
      }

      continuation = response.has_continuation;
      if (continuation) {
        response = await response.getContinuation();
      }
    } while (continuation);

    await this.redis.setAsync(this.playlistCache.key(playlist.id), playlist, this.playlistCache.ttl());
    return await this.getPlaylistFromCacheAsync(playlist);
  }

  public async getSongAsync(url: string): Promise<ISong> {
    const videoId = this.getVideoId(url) || url;
    const cached = await this.redis.getAsync(this.songCache.key(videoId));
    if (cached) return cached as ISong;

    const innertube = await this.createInnerTubeAsync();
    const response = await innertube.getBasicInfo(videoId);
    if (!response) throw new Error(messages.songNotFound);

    const song: ISong = {
      id: response.basic_info.id!,
      title: response.basic_info.title!,
      duration: response.basic_info.duration!,
      author: response.basic_info.author!,
      thumbnail: response.basic_info.thumbnail?.at(0)?.url!,
      url: this.getUrlFromId(response.basic_info.id!),
      platform: Platform.YOUTUBE
    };
    await this.redis.setAsync(this.songCache.key(song.id), song, this.songCache.ttl());
    return song;
  }

  public async searchAsync(query: string): Promise<ISong> {
    const innertube = await this.createInnerTubeAsync();
    const response = await innertube.search(query, { type: 'video' });
    if (response.results.length === 0) throw new Error(`${messages.searchNotFound} ${query}`);

    const video = response.results.at(0) as any;
    if (!video) throw new Error(`${messages.searchNotFound} ${query}`);

    const song: ISong = {
      id: video.video_id,
      title: video.title.text,
      duration: timeStringToSeconds(video.length_text.text),
      author: video.author.name,
      thumbnail: video.thumbnails.at(0).url,
      url: this.getUrlFromId(video.video_id),
      platform: Platform.YOUTUBE
    };
    await this.redis.setAsync(this.songCache.key(song.id), song, this.songCache.ttl());
    return song;
  }

  private async getPlaylistFromCacheAsync(cached: IPlaylistCache): Promise<IPlaylist> {
    const playlist: IPlaylist = { ...cached, songs: [] };
    for (const id of cached.ids) {
      playlist.songs.push(await this.getSongAsync(id));
    }
    return playlist;
  }

  private getUrlFromId(id: string): string {
    return `https://youtu.be/${id}`;
  }

  private getPlaylistId(url: string): string | null | undefined {
    return url.match(youtubePlaylistRegex)?.[1];
  }

  private getVideoId(url: string): string | null | undefined {
    return url.match(youtubeVideoRegex)?.[1];
  }
}
