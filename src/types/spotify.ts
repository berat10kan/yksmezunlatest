export type MusicGenre =
  | 'LOFI'
  | 'CLASSICAL'
  | 'PHONK'
  | 'TURKISH_ACOUSTIC'
  | 'SYNTHWAVE'
  | 'OFF';

export interface MusicBuff {
  id: MusicGenre;
  name: string;
  artistHint: string;
  badge: string;
  color: string;
  accentBg: string;
  borderColor: string;
  description: string;
  iconName: string;
  spotifyPlaylistId: string;
  spotifyEmbedUrl: string;
  effects: {
    stressMultiplier?: number; // e.g. 0.65 -> 35% less stress
    bpMultiplier?: number; // e.g. 1.25 -> 25% more BP
    studySpeedMultiplier?: number; // e.g. 1.5 -> 50% faster
    energyCostMultiplier?: number; // e.g. 0.9 -> 10% less energy
    examNetBonus?: number; // e.g. +2.5 Net
    moraleRegenPerSec?: number; // e.g. +0.5
    nightBonusMultiplier?: number; // e.g. 1.6
  };
  buffTags: string[];
}

export interface SpotifyTrackInfo {
  title: string;
  artist: string;
  albumArt?: string;
  genre: MusicGenre;
  isPlaying: boolean;
}

export interface SpotifyConnectionState {
  isConnected: boolean;
  accessToken: string | null;
  displayName: string | null;
  productType: string | null; // 'premium' | 'free'
  clientId: string;
}
