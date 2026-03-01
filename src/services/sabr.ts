import { Constants, Innertube } from 'youtubei.js';
import { SabrStream, type SabrPlaybackOptions } from 'googlevideo/sabr-stream';
import { IYoutubeStream } from '@/types';
import { buildSabrFormat } from 'googlevideo/utils';
import { BotguardService } from '@/services';

export class SabrService {
  private innertube: Innertube;
  private botguardService: BotguardService;

  constructor(innertube: Innertube) {
    this.innertube = innertube;
    this.botguardService = new BotguardService(innertube);
  }

  public async createSabrStream(videoId: string, options: SabrPlaybackOptions): Promise<IYoutubeStream> {
    const webPoTokenResult = await this.botguardService.generateWebPoToken(videoId);

    // Get video metadata.
    const metadata = await this.innertube.getInfo(videoId, {
      po_token: webPoTokenResult.poToken
    });
    const videoTitle = metadata.basic_info?.title || 'Unknown Video';
    console.log(this.innertube.session.po_token);

    // Now get the streaming information.
    const serverAbrStreamingUrl = await this.innertube.session.player?.decipher(metadata.streaming_data?.server_abr_streaming_url);
    const videoPlaybackUstreamerConfig = metadata.player_config?.media_common_config.media_ustreamer_request_config?.video_playback_ustreamer_config;

    if (!videoPlaybackUstreamerConfig) throw new Error('ustreamerConfig not found');
    if (!serverAbrStreamingUrl) throw new Error('serverAbrStreamingUrl not found');

    const sabrFormats = metadata.streaming_data?.adaptive_formats.map(buildSabrFormat) || [];

    const serverAbrStream = new SabrStream({
      formats: sabrFormats,
      serverAbrStreamingUrl,
      videoPlaybackUstreamerConfig,
      poToken: webPoTokenResult.poToken,
      clientInfo: {
        clientName: parseInt(Constants.CLIENT_NAME_IDS[this.innertube.session.context.client.clientName as keyof typeof Constants.CLIENT_NAME_IDS]),
        clientVersion: this.innertube.session.context.client.clientVersion
      }
    });

    const { videoStream, audioStream, selectedFormats } = await serverAbrStream.start(options);
    return <IYoutubeStream>{
      videoStream,
      audioStream,
      selectedFormats,
      videoTitle
    };
  }
}