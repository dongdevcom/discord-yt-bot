import { JSDOM } from 'jsdom';
import { Constants, Innertube, IRawResponse } from 'youtubei.js';
import { SabrStream, type SabrPlaybackOptions } from 'googlevideo/sabr-stream';
import { buildSabrFormat } from 'googlevideo/utils';
import { BotGuardClient } from 'bgutils-js/botguard';
import { WebPoSignalOutput } from 'bgutils-js/shared-types';
import { buildURL, getHeaders, USER_AGENT, parseLooseJSON, } from 'bgutils-js/utils';
import { WebPoMinter } from 'bgutils-js/webpo';
import { IPoToken } from '@/types';
import { IYoutubeStream } from '@/types';

export class SabrService {
  private readonly requestKey = 'O43z0dpjhgX20SCx4KAo';
  private innertube: Innertube;

  constructor(innertube: Innertube) {
    this.innertube = innertube;
  }

  public async generateWebPoToken(videoId: string): Promise<IPoToken> {
    if (!videoId) {
      throw new Error('Video ID required for PO token generation');
    }

    //#region BotGuard Client
    const dom = new JSDOM('<!DOCTYPE html><html lang="en"><head><title></title></head><body></body></html>', {
      url: 'https://www.youtube.com',
      referrer: 'https://www.youtube.com/',
      resources: {
        userAgent: USER_AGENT,
      },
    });

    const pageResponse = await fetch('https://www.youtube.com', {
      headers: {
        'accept': '*/*',
        'accept-language': 'en-US,en;q=0.7',
        'user-agent': USER_AGENT,
      }
    });

    const pageHtml = await pageResponse.text();

    const ytConfig = pageHtml.match(/ytcfg\.set\(({.+?})\);/s)?.[1];
    if (!ytConfig) {
      throw new Error('Could not find ytcfg in page HTML');
    }

    dom.window.yt = { config_: JSON.parse(ytConfig) /* Needed because of EVENT_ID */ };

    Object.assign(globalThis, {
      yt: dom.window.yt,
      window: dom.window,
      document: dom.window.document,
      location: dom.window.location,
      origin: dom.window.origin
    });

    if (!('navigator' in globalThis)) {
      Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator });
    }

    const initialAttestationData = pageHtml.match(/window\.ytAtN\(\s*({[\s\S]*?})\s*\)/);

    if (!initialAttestationData) {
      throw new Error('Could not find challenge in page HTML');
    }

    const initialAttestationDataJson = parseLooseJSON(initialAttestationData[1]);
    const challengeResponse = initialAttestationDataJson.R as IRawResponse;

    if (!challengeResponse.bgChallenge)
      throw new Error('Could not get challenge');

    const interpreterUrl = challengeResponse.bgChallenge.interpreterUrl.privateDoNotAccessOrElseTrustedResourceUrlWrappedValue;
    const bgScriptResponse = await fetch(`https:${interpreterUrl}`);
    const interpreterJavascript = await bgScriptResponse.text();

    if (interpreterJavascript) {
      new Function(interpreterJavascript)();
    } else throw new Error('Could not load VM');

    const botGuardClient = await BotGuardClient.create({
      program: challengeResponse.bgChallenge.program,
      globalName: challengeResponse.bgChallenge.globalName,
      globalObject: globalThis
    });
    //#endregion

    //#region WebPO Minter
    const webPoSignalOutput: WebPoSignalOutput = [];
    const botguardResponse = await botGuardClient.snapshot({ webPoSignalOutput });

    const payload = [this.requestKey, botguardResponse];

    const integrityTokenResponse = await fetch(buildURL('GenerateIT', true), {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });

    const integrityTokenJson = await integrityTokenResponse.json() as [string, number, number, string];

    const [integrityToken, estimatedTtlSecs, mintRefreshThreshold, websafeFallbackToken] = integrityTokenJson;

    const integrityTokenData = {
      integrityToken,
      estimatedTtlSecs,
      mintRefreshThreshold,
      websafeFallbackToken
    };

    const webPoMinter = await WebPoMinter.create(integrityTokenData, webPoSignalOutput);
    const contentPoToken = await webPoMinter.mintAsWebsafeString(videoId);
    //#endregion

    return <IPoToken>{
      poToken: contentPoToken,
    };
  }

  public async createSabrStream(videoId: string, options: SabrPlaybackOptions): Promise<IYoutubeStream> {
    const webPoTokenResult = await this.generateWebPoToken(videoId);

    // Get video metadata.
    const metadata = await this.innertube.getInfo(videoId, {
      po_token: webPoTokenResult.poToken
    });
    const videoTitle = metadata.basic_info?.title || 'Unknown Video';

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

    // Handle player response reload events (e.g, when IP changes, or formats expire).
    serverAbrStream.on('reloadPlayerResponse', async (reloadPlaybackContext) => {
      const metadata = await this.innertube.getInfo(videoId, {
        po_token: webPoTokenResult.poToken
      });
      const serverAbrStreamingUrl = await this.innertube.session.player?.decipher(metadata.streaming_data?.server_abr_streaming_url);
      const videoPlaybackUstreamerConfig = metadata.player_config?.media_common_config.media_ustreamer_request_config?.video_playback_ustreamer_config;

      if (serverAbrStreamingUrl && videoPlaybackUstreamerConfig) {
        serverAbrStream.setStreamingURL(serverAbrStreamingUrl);
        serverAbrStream.setUstreamerConfig(videoPlaybackUstreamerConfig);
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