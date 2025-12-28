import { StreamType } from '@discordjs/voice';

export const formatSeconds = (seconds: number): string => {
  var date = new Date(1970, 0, 1);
  date.setSeconds(seconds);
  return date.toTimeString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, '$1');
};

export const shuffle = (unshuffled: any[]): any[] => {
  return unshuffled
    .map(value => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value)
};

export const timeStringToSeconds = (time: string): number => {
  const parts = time.split(':').map(Number);

  if (parts.length === 2) {
    // Format: mm:ss
    const [minutes, seconds] = parts;
    return minutes * 60 + seconds;
  }

  if (parts.length === 3) {
    // Format: hh:mm:ss
    const [hours, minutes, seconds] = parts;
    return hours * 3600 + minutes * 60 + seconds;
  }

  throw new Error('Invalid time format');
}

export const isSameDay = (date1: Date, date2: Date): boolean => {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
}

export const isBeetweenDates = (date: Date, start: Date, end: Date): boolean => {
  return date >= start && date <= end;
}

export const detectAudioFormat = (mimeType: string | undefined): StreamType => {
  if (!mimeType) return StreamType.Arbitrary;
  const mt = mimeType.toLowerCase();

  if (mt.includes('audio/pcm') ||
      mt.includes('audio/l16') ||
      mt.includes('audio/wav') ||
      mt.includes('audio/x-wav')) {
    return StreamType.Raw;
  }

  if (mt.includes('audio/ogg') || mt.includes('application/ogg')) {
    return StreamType.OggOpus;
  }

  if (mt.includes('audio/webm')) {
    return StreamType.WebmOpus;
  }

  if (mt.includes('audio/opus')) {
    return StreamType.Opus;
  }

  return StreamType.Arbitrary;
}