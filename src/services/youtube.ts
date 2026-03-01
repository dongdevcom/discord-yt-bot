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
import { SabrService } from '@/services';
import {
  IMusicService,
  IPlaylist,
  ISong
} from '@/types';
import { youtubePlaylistRegex, youtubeVideoRegex } from '@/constants/regex'
import messages from '@/constants/messages';
import {
  timeStringToSeconds,
  getCookie,
  detectAudioFormat
} from '@/utils';


export class YoutubeService implements IMusicService {
  private innertube: Innertube;
  private sabrService: SabrService;

  constructor(innertube: Innertube, sabrService: SabrService) {
    this.innertube = innertube;
    this.sabrService = sabrService;
  }

  static async create() {
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

    const cookie = await getCookie();
    const innertube = await Innertube.create({
      cookie,
      cache: new UniversalCache(true)
    });
;
    const sabrService = new SabrService(innertube);
    return new YoutubeService(innertube, sabrService);
  }

  public async createAudioResource(song: ISong): Promise<AudioResource> {
    const options: SabrPlaybackOptions = {
      preferWebM: true,
      preferOpus: true,
      audioQuality: 'AUDIO_QUALITY_MEDIUM',
      enabledTrackTypes: EnabledTrackTypes.AUDIO_ONLY
    };

    const { audioStream, selectedFormats } = await this.sabrService.createSabrStream(song.id, options);

    const nodeReadable = Readable.fromWeb(audioStream as NodeReadableStream);
    const inputType = detectAudioFormat(selectedFormats?.audioFormat?.mimeType);
    return createAudioResource(nodeReadable, { inputType });
  }

  public async getPlaylistAsync(url: string): Promise<IPlaylist> {
    const playlistId = this.getPlaylistId(url) || url;

    let response = await this.innertube.getPlaylist(playlistId);
    if (!response) throw new Error(messages.playlistNotFound);

    const playlist: IPlaylist = {
      id: playlistId,
      title: response.info.title!,
      thumbnail: response.info.thumbnails?.at(0)?.url!,
      author: response.info.author.name!,
      songs: []
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
      playlist.songs.push(...songs);
      continuation = response.has_continuation;
      if (continuation) {
        response = await response.getContinuation();
      }
    } while (continuation);
    return playlist;
  }

  public async getSongAsync(url: string): Promise<ISong> {
    const videoId = this.getVideoId(url) || url;

    const response = await this.innertube.getBasicInfo(videoId);
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
    return song;
  }

  public async searchAsync(query: string): Promise<ISong> {
    const response = await this.innertube.search(query, { type: 'video' });
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
    return song;
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
