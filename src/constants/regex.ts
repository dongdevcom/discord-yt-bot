export const youtubeVideoRegex = new RegExp(
  /(?:youtube\.com\/(?:.*[?&]v=|.*\/|v\/|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
);

export const youtubePlaylistRegex = new RegExp(
  /(?:youtube\.com)\/.*\?.*?\blist=([a-zA-Z0-9_-]+)/,
);

export const soundCloudTrackRegex = new RegExp(
  /^https?:\/\/(soundcloud\.com|snd\.sc)\/(.*)$/,
);

export const soundCloudPlaylistRegex = new RegExp(
  /^https?:\/\/(soundcloud\.com|snd\.sc)\/([^?]*)\/sets\/(.*)$/,
);

export const discordInviteShortRegex = new RegExp(
  /https:\/\/discord\.gg\/(\w+)/,
);

export const discordInviteRegex = new RegExp(
  /https:\/\/discord\.com\/invite\/(\w+)/,
);
