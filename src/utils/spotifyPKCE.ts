/**
 * Direct Spotify PKCE (Proof Key for Code Exchange) OAuth & API service.
 * Allows full Spotify integration directly from client (Android APK, LDPlayer, Web, Vercel)
 * without requiring any external server, proxy, or secret keys!
 */

export const DEFAULT_SPOTIFY_CLIENT_ID = '48350646fe5f451ba27cecf8fe0d813a';
const CLIENT_ID_STORAGE_KEY = 'mezun_spotify_client_id';
const CODE_VERIFIER_KEY = 'mezun_spotify_pkce_verifier';

export const getStoredSpotifyClientId = (): string => {
  if (typeof window === 'undefined') return DEFAULT_SPOTIFY_CLIENT_ID;
  const saved = localStorage.getItem(CLIENT_ID_STORAGE_KEY);
  if (saved && saved.trim()) return saved.trim();
  return DEFAULT_SPOTIFY_CLIENT_ID;
};

export const setStoredSpotifyClientId = (id: string): void => {
  if (typeof window === 'undefined') return;
  if (!id || !id.trim()) {
    localStorage.removeItem(CLIENT_ID_STORAGE_KEY);
  } else {
    localStorage.setItem(CLIENT_ID_STORAGE_KEY, id.trim());
  }
};

/**
 * Determines the optimal redirect URI for current environment
 */
export const getEffectiveRedirectUri = (): string => {
  if (typeof window === 'undefined') return 'https://localhost/auth/callback';

  const origin = window.location.origin;
  // If running in Capacitor / Android WebView
  if (
    origin.includes('localhost') ||
    origin.includes('capacitor://') ||
    (window as any).Capacitor?.isNativePlatform?.()
  ) {
    return 'https://localhost/auth/callback';
  }

  // Running on web / Vercel
  return `${origin}/auth/callback`;
};

/**
 * Generates high-entropy cryptographic random string for PKCE code verifier
 */
function generateRandomString(length: number): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let result = '';
  const randomValues = new Uint8Array(length);
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(randomValues);
    for (let i = 0; i < length; i++) {
      result += charset[randomValues[i] % charset.length];
    }
  } else {
    for (let i = 0; i < length; i++) {
      result += charset[Math.floor(Math.random() * charset.length)];
    }
  }
  return result;
}

/**
 * SHA-256 base64url hash for PKCE code challenge
 */
async function generateCodeChallenge(verifier: string): Promise<string> {
  if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
    // Fallback simple base64 if subtle not available
    return btoa(verifier).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  }

  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  const base64 = btoa(String.fromCharCode(...new Uint8Array(digest)));
  return base64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

/**
 * Builds the Spotify Authorization URL using standard PKCE flow
 */
export async function createSpotifyAuthUrl(
  clientId?: string,
  redirectUri?: string
): Promise<{ authUrl: string; codeVerifier: string; redirectUri: string }> {
  const activeClientId = clientId || getStoredSpotifyClientId();
  const activeRedirectUri = redirectUri || getEffectiveRedirectUri();

  const codeVerifier = generateRandomString(64);
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  if (typeof window !== 'undefined') {
    localStorage.setItem(CODE_VERIFIER_KEY, codeVerifier);
  }

  const scopes = [
    'user-read-currently-playing',
    'user-read-playback-state',
    'user-read-recently-played',
    'user-top-read',
  ].join(' ');

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: activeClientId,
    scope: scopes,
    redirect_uri: activeRedirectUri,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
  });

  return {
    authUrl: `https://accounts.spotify.com/authorize?${params.toString()}`,
    codeVerifier,
    redirectUri: activeRedirectUri,
  };
}

/**
 * Exchanges authorization code for access & refresh tokens directly with Spotify (no server needed)
 */
export async function exchangeSpotifyTokenPKCE(
  code: string,
  clientId?: string,
  redirectUri?: string
): Promise<{ access_token: string; refresh_token?: string; expires_in: number }> {
  const activeClientId = clientId || getStoredSpotifyClientId();
  const activeRedirectUri = redirectUri || getEffectiveRedirectUri();
  const verifier =
    (typeof window !== 'undefined' ? localStorage.getItem(CODE_VERIFIER_KEY) : null) || '';

  const bodyParams = new URLSearchParams({
    client_id: activeClientId,
    grant_type: 'authorization_code',
    code: String(code).trim(),
    redirect_uri: activeRedirectUri,
  });

  if (verifier) {
    bodyParams.append('code_verifier', verifier);
  }

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: bodyParams.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorDetail = `HTTP ${response.status}`;
    try {
      const parsed = JSON.parse(errorText);
      errorDetail = parsed.error_description || parsed.error || errorDetail;
    } catch {
      // ignore
    }
    throw new Error(errorDetail);
  }

  const data = await response.json();
  if (typeof window !== 'undefined') {
    localStorage.removeItem(CODE_VERIFIER_KEY);
  }

  return data;
}

/**
 * Refreshes an expired Spotify access token using the refresh token directly with Spotify
 */
export async function refreshSpotifyTokenPKCE(
  refreshToken: string,
  clientId?: string
): Promise<{ access_token: string; refresh_token?: string; expires_in: number }> {
  const activeClientId = clientId || getStoredSpotifyClientId();

  const bodyParams = new URLSearchParams({
    client_id: activeClientId,
    grant_type: 'refresh_token',
    refresh_token: refreshToken.trim(),
  });

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: bodyParams.toString(),
  });

  if (!response.ok) {
    throw new Error(`Token refresh failed (HTTP ${response.status})`);
  }

  return response.json();
}

/**
 * Directly fetches what's currently playing from Spotify Web API
 */
export async function fetchCurrentSpotifyTrackDirect(accessToken: string) {
  const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (response.status === 204 || response.status === 404) {
    return { track: null, isPlaying: false };
  }

  if (response.status === 401) {
    throw new Error('TOKEN_EXPIRED');
  }

  if (!response.ok) {
    throw new Error(`Spotify API error (HTTP ${response.status})`);
  }

  const data = await response.json();
  if (!data || !data.item) {
    return { track: null, isPlaying: false };
  }

  const track = {
    name: data.item.name,
    artist: (data.item.artists || []).map((a: any) => a.name).join(', '),
    albumArt: data.item.album?.images?.[0]?.url || data.item.album?.images?.[1]?.url,
    albumName: data.item.album?.name,
    durationMs: data.item.duration_ms,
    progressMs: data.progress_ms,
    isPlaying: Boolean(data.is_playing),
    trackUrl: data.item.external_urls?.spotify,
  };

  return { track, isPlaying: track.isPlaying };
}
