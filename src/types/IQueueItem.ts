import { ISong } from '@/types';

export interface IQueueItem {
  song: ISong;
  requester: string;
}