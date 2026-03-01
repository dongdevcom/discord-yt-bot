import type { SabrFormat } from 'googlevideo/shared-types';

export interface IYoutubeStream {
  videoStream: ReadableStream;
  audioStream: ReadableStream;
  selectedFormats: {
    videoFormat: SabrFormat;
    audioFormat: SabrFormat;
  };
  videoTitle: string;
}