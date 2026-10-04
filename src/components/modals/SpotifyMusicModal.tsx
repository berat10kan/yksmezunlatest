import React, { useState, useEffect } from 'react';
import {
  Music,
  Headphones,
  Zap,
  Sparkles,
  Heart,
  Coffee,
  Flame,
  CheckCircle2,
  RefreshCw,
  X,
  Volume2,
  Copy,
  Info,
  Radio,
  Tag,
  Disc3,
  Layers,
} from 'lucide-react';
import { MusicGenre, SpotifyTrack } from '../../types/game';
import { MUSIC_BUFFS, detectGenreFromTrack } from '../../data/musicData';
import { sounds } from '../../utils/audio';
import {
  fetchFromBackend,
  autoDiscoverWorkingBackendUrl,
  isNativeAndroidApp,
  checkBackendHealth,
  getBackendBaseUrl,
  setBackendBaseUrl,
  BackendHealthInfo,
} from '../../utils/backendConfig';
import {
  createSpotifyAuthUrl,
  exchangeSpotifyTokenPKCE,
  fetchCurrentSpotifyTrackDirect,
  refreshSpotifyTokenPKCE,
  getStoredSpotifyClientId,
  setStoredSpotifyClientId,
  getEffectiveRedirectUri,
  DEFAULT_SPOTIFY_CLIENT_ID,
} from '../../utils/spotifyPKCE';
import { Smartphone, ExternalLink, Globe, Server, Settings2, Check, AlertCircle } from 'lucide-react';

interface SpotifyMusicModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeGenre: MusicGenre;
  onSelectGenre: (genre: MusicGenre, customTrack?: SpotifyTrack) => void;
}

const SPOTIFY_TOKEN_KEY = 'mezun_spotify_access_token';
const SPOTIFY_REFRESH_KEY = 'mezun_spotify_refresh_token';

// Primary 8 genres to display
const DISPLAY_GENRES: MusicGenre[] = [
  'CLASSICAL',
  'METAL_ROCK',
  'LO_FI',
  'RAP_TRAP',
  'POP_DANCE',
  'TURKISH_NOSTALGIA',
  'JAZZ_ACOUSTIC',
  'PHONK_DRIFT',
];

export const SpotifyMusicModal: React.FC<SpotifyMusicModalProps> = ({
  isOpen,
  onClose,
  activeGenre,
  onSelectGenre,
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<SpotifyTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isCheckingServer, setIsCheckingServer] = useState(false);
  const [serverConfigured, setServerConfigured] = useState<boolean | null>(null);
  const [redirectUri, setRedirectUri] = useState<string>('');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [customServerInput, setCustomServerInput] = useState(() => localStorage.getItem('mezun_backend_server_url') || '');
  const [showServerSettings, setShowServerSettings] = useState(false);
  const [activeServerUrl, setActiveServerUrl] = useState<string>(() => getBackendBaseUrl());
  const [serverHealth, setServerHealth] = useState<BackendHealthInfo | null>(null);
  const [testingServer, setTestingServer] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const isApk = isNativeAndroidApp();

  // Check server spotify status on mount
  useEffect(() => {
    if (!isOpen) return;

    const checkStatus = async () => {
      setIsCheckingServer(true);
      const health = await checkBackendHealth();
      setServerHealth(health);
      setServerConfigured(health.configured);
      setActiveServerUrl(health.url || (typeof window !== 'undefined' ? window.location.origin : ''));
      if (health.redirectUri) {
        setRedirectUri(health.redirectUri);
      } else {
        setRedirectUri(`${window.location.origin}/auth/callback`);
      }
      setIsCheckingServer(false);

      // Check if we have a saved token
      const savedToken = localStorage.getItem(SPOTIFY_TOKEN_KEY);
      if (savedToken) {
        setIsConnected(true);
        fetchNowPlaying(savedToken);
      }
    };

    checkStatus();
  }, [isOpen]);

  const handleTestAndSaveServer = async (targetUrl: string) => {
    if (!targetUrl || !targetUrl.trim()) {
      setTestResult('Lütfen geçerli bir sunucu URL adresi girin.');
      return;
    }
    setTestingServer(true);
    setTestResult('Sunucuya bağlanılıyor ve test ediliyor...');
    const cleanUrl = targetUrl.trim().replace(/\/+$/, '');
    const health = await checkBackendHealth(cleanUrl);
    setTestingServer(false);

    if (health.isOnline) {
      setBackendBaseUrl(cleanUrl);
      setActiveServerUrl(cleanUrl);
      setServerHealth(health);
      setServerConfigured(health.configured);
      if (health.redirectUri) setRedirectUri(health.redirectUri);
      sounds.playSuccess();
      setTestResult(
        `✅ Sunucu aktif! (${health.configured ? 'Spotify API hazır' : 'Uyarı: Sunucuda SPOTIFY_CLIENT_ID tanımlanmamış'})`
      );
      setStatusMessage(`Aktif sunucu güncellendi: ${cleanUrl}`);
    } else {
      sounds.playTap();
      setTestResult(`❌ Bağlantı hatası: ${health.error || 'Sunucuya ulaşılamadı'}. Lütfen Vercel URL'sini kontrol edin.`);
    }
  };

  const handleResetToAuto = async () => {
    setBackendBaseUrl('');
    setCustomServerInput('');
    setTestResult(null);
    sounds.playTap();
    setIsCheckingServer(true);
    const health = await checkBackendHealth('');
    setServerHealth(health);
    setServerConfigured(health.configured);
    setActiveServerUrl(health.url || (typeof window !== 'undefined' ? window.location.origin : ''));
    if (health.redirectUri) setRedirectUri(health.redirectUri);
    setIsCheckingServer(false);
    setStatusMessage('Sunucu otomatik algılama moduna alındı.');
  };

  // Listen for OAuth callback message from popup
  useEffect(() => {
    const handleOAuthMessage = async (event: MessageEvent) => {
      if (event.data?.type === 'SPOTIFY_AUTH_CALLBACK') {
        const { code, error } = event.data;
        if (error) {
          setStatusMessage(`Spotify bağlantısı reddedildi: ${error}`);
          setIsConnecting(false);
          return;
        }

        if (code) {
          try {
            setStatusMessage('Yetkilendirme kodu doğrulanıyor...');
            let tokenData: any = null;

            // 1. Direct PKCE exchange (no server required!)
            try {
              tokenData = await exchangeSpotifyTokenPKCE(code, undefined, redirectUri);
            } catch {
              // 2. Fallback to backend exchange
              const exchangeRes = await fetchFromBackend('/api/spotify/exchange-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code }),
              });

              if (!exchangeRes.ok) {
                const errData = await exchangeRes.json().catch(() => ({}));
                throw new Error(errData.error || 'Token değişimi başarısız oldu');
              }
              tokenData = await exchangeRes.json();
            }

            if (tokenData && tokenData.access_token) {
              localStorage.setItem(SPOTIFY_TOKEN_KEY, tokenData.access_token);
              if (tokenData.refresh_token) {
                localStorage.setItem(SPOTIFY_REFRESH_KEY, tokenData.refresh_token);
              }

              setIsConnected(true);
              setIsConnecting(false);
              setStatusMessage('Spotify hesabın başarıyla bağlandı! 🎧');
              sounds.playSuccess();
              fetchNowPlaying(tokenData.access_token);
            }
          } catch (err: any) {
            setStatusMessage(`Hata: ${err.message}`);
            setIsConnecting(false);
          }
        }
      }
    };

    window.addEventListener('message', handleOAuthMessage);

    // Also check if app was opened via redirect with ?code= or #code= in URL (for mobile browser / deep link redirects)
    const checkUrlForCode = () => {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
        const code = searchParams.get('code') || hashParams.get('code');
        const error = searchParams.get('error') || hashParams.get('error');

        if (error) {
          setStatusMessage(`Spotify bağlantı reddi: ${error}`);
        } else if (code) {
          // Clear query params from url to keep it clean
          window.history.replaceState({}, document.title, window.location.pathname);
          handleOAuthMessage({
            data: { type: 'SPOTIFY_AUTH_CALLBACK', code },
          } as MessageEvent);
        }
      } catch (e) {
        // ignore
      }
    };

    checkUrlForCode();

    return () => window.removeEventListener('message', handleOAuthMessage);
  }, [redirectUri]);

  // Fetch currently playing track from Spotify API
  const fetchNowPlaying = async (token?: string) => {
    const authToken = token || localStorage.getItem(SPOTIFY_TOKEN_KEY);
    if (!authToken) return;

    try {
      let rawTrack: any = null;
      let isPlayingTrack = false;

      // 1. Direct Spotify API call (zero backend dependency)
      try {
        const direct = await fetchCurrentSpotifyTrackDirect(authToken);
        rawTrack = direct.track;
        isPlayingTrack = direct.isPlaying;
      } catch (directErr: any) {
        if (directErr.message === 'TOKEN_EXPIRED') {
          const refreshToken = localStorage.getItem(SPOTIFY_REFRESH_KEY);
          if (refreshToken) {
            try {
              const refreshed = await refreshSpotifyTokenPKCE(refreshToken);
              localStorage.setItem(SPOTIFY_TOKEN_KEY, refreshed.access_token);
              const retry = await fetchCurrentSpotifyTrackDirect(refreshed.access_token);
              rawTrack = retry.track;
              isPlayingTrack = retry.isPlaying;
            } catch {
              setIsConnected(false);
              localStorage.removeItem(SPOTIFY_TOKEN_KEY);
              setStatusMessage('Oturum süresi doldu, lütfen tekrar bağlanın.');
              return;
            }
          } else {
            setIsConnected(false);
            localStorage.removeItem(SPOTIFY_TOKEN_KEY);
            setStatusMessage('Oturum süresi doldu, lütfen tekrar bağlanın.');
            return;
          }
        } else {
          // Fallback to backend route
          const res = await fetchFromBackend('/api/spotify/current-track', {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          });

          if (res.status === 401) {
            setIsConnected(false);
            localStorage.removeItem(SPOTIFY_TOKEN_KEY);
            setStatusMessage('Oturum süresi doldu, lütfen tekrar bağlan.');
            return;
          }

          if (res.ok) {
            const data = await res.json();
            rawTrack = data.track;
            isPlayingTrack = data.isPlaying;
          }
        }
      }

      if (rawTrack) {
        // Detect genre using both title keywords and Spotify artist genres
        const detected = detectGenreFromTrack(
          rawTrack.name,
          rawTrack.artist,
          rawTrack.albumName || '',
          rawTrack.artistGenres || []
        );

        const trackWithGenre: SpotifyTrack = {
          ...rawTrack,
          detectedGenre: detected,
        };

        setCurrentTrack(trackWithGenre);
        setIsPlaying(isPlayingTrack);

        // Automatically apply detected buff to the game
        onSelectGenre(detected, trackWithGenre);
        const buff = MUSIC_BUFFS[detected];
        setStatusMessage(`Çalan: ${rawTrack.name} [${buff.name}: ${buff.badge}] otomatik uygulandı!`);
      } else {
        setCurrentTrack(null);
        setIsPlaying(false);
        setStatusMessage("Şu an Spotify'da bir parça çalmıyor. Müzik açtığında otomatik algılanır.");
      }
    } catch (err: any) {
      console.error('Spotify fetch error:', err);
    }
  };

  // Trigger Spotify Connect OAuth
  const handleConnectSpotify = async () => {
    try {
      setIsConnecting(true);
      setStatusMessage('Spotify giriş sayfasına yönlendiriliyorsunuz...');

      // 1. Direct PKCE flow - creates authorize URL instantly without relying on Vercel
      let url: string;
      try {
        const pkce = await createSpotifyAuthUrl(undefined, redirectUri);
        url = pkce.authUrl;
      } catch {
        // Fallback to backend
        const res = await fetchFromBackend('/api/spotify/auth-url');
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Auth URL alınamadı' }));
          throw new Error(err.error || 'Auth URL alınamadı');
        }
        const data = await res.json();
        url = data.url;
      }

      // In Android APK, window.open with popup parameters often gets blocked by WebView.
      // On mobile/APK, we open the authorization URL directly in browser / custom tab:
      if (isNativeAndroidApp()) {
        window.location.href = url;
        return;
      }

      const width = 500;
      const height = 650;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const popup = window.open(
        url,
        'spotify_oauth',
        `width=${width},height=${height},left=${left},top=${top},status=0,toolbar=0,menubar=0`
      );

      if (!popup) {
        // Fallback if popup is blocked
        window.location.href = url;
      }
    } catch (err: any) {
      setStatusMessage(`Bağlantı hatası: ${err.message}`);
      setIsConnecting(false);
    }
  };

  // Disconnect Spotify
  const handleDisconnect = () => {
    localStorage.removeItem(SPOTIFY_TOKEN_KEY);
    localStorage.removeItem(SPOTIFY_REFRESH_KEY);
    setIsConnected(false);
    setCurrentTrack(null);
    setStatusMessage('Spotify bağlantısı kesildi.');
  };

  const copyCallbackUrl = () => {
    const url = redirectUri || `${window.location.origin}/auth/callback`;
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  if (!isOpen) return null;

  // Active or detected genre theme
  const activeBuff = MUSIC_BUFFS[activeGenre] || MUSIC_BUFFS.LO_FI;
  const currentTheme = activeBuff.theme || {
    accentColor: '#10b981',
    bgGradient: 'from-slate-950 via-emerald-950/40 to-slate-900',
    cardBorder: 'border-emerald-500/40',
    glowShadow: 'shadow-[0_0_35px_rgba(16,185,129,0.2)]',
    coverPlaceholder: 'from-emerald-900/40 to-slate-900',
    ambientBgUrl: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=800&q=80',
    tagline: 'Müzikal Odak Modu',
  };

  const renderGenreIcon = (genre: MusicGenre, customClass?: string) => {
    const cls = customClass || 'w-4 h-4';
    switch (genre) {
      case 'CLASSICAL': return <Sparkles className={`${cls} text-purple-400`} />;
      case 'METAL_ROCK':
      case 'ROCK_TRAP': return <Zap className={`${cls} text-rose-400`} />;
      case 'LO_FI': return <Headphones className={`${cls} text-emerald-400`} />;
      case 'RAP_TRAP': return <Flame className={`${cls} text-amber-400`} />;
      case 'POP_DANCE':
      case 'POP_ENERGY': return <Sparkles className={`${cls} text-cyan-400`} />;
      case 'TURKISH_NOSTALGIA': return <Heart className={`${cls} text-amber-300`} />;
      case 'JAZZ_ACOUSTIC': return <Coffee className={`${cls} text-yellow-300`} />;
      case 'PHONK_DRIFT': return <Zap className={`${cls} text-violet-400`} />;
      default: return <Music className={`${cls} text-slate-400`} />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      {/* Modal Window Container with Dynamic Themed Background */}
      <div
        className={`bg-slate-950 rounded-2xl max-w-sm w-full shadow-2xl relative flex flex-col gap-3 max-h-[92vh] overflow-y-auto border transition-all duration-500 ${currentTheme.cardBorder} ${currentTheme.glowShadow}`}
      >
        {/* Dynamic Aesthetic Background Ambient Cover */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none -z-0">
          {/* Genre Background Artwork Image */}
          <img
            src={currentTheme.ambientBgUrl}
            alt={activeBuff.name}
            className="w-full h-44 object-cover opacity-25 filter blur-[1px] scale-105 transition-all duration-700"
          />
          {/* Ambient Vignette & Gradient Overlays */}
          <div
            className={`absolute inset-0 bg-gradient-to-b ${currentTheme.bgGradient} opacity-90 transition-colors duration-500`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent" />
        </div>

        {/* Top Glowing Dynamic Accent Bar */}
        <div
          className="absolute top-0 left-0 right-0 h-1 transition-all duration-500 z-10"
          style={{
            background: `linear-gradient(90deg, ${currentTheme.accentColor} 0%, #10b981 50%, ${currentTheme.accentColor} 100%)`,
            boxShadow: `0 0 12px ${currentTheme.accentColor}`,
          }}
        />

        {/* Modal Inner Content */}
        <div className="relative z-10 p-4 flex flex-col gap-3">
          {/* Header */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-300 shadow-sm"
                style={{
                  backgroundColor: `${currentTheme.accentColor}25`,
                  borderColor: currentTheme.accentColor,
                  color: currentTheme.accentColor,
                }}
              >
                {renderGenreIcon(activeGenre, 'w-4 h-4')}
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span>Spotify Müzik Odası</span>
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded border flex items-center gap-1"
                    style={{
                      backgroundColor: `${currentTheme.accentColor}20`,
                      color: currentTheme.accentColor,
                      borderColor: `${currentTheme.accentColor}50`,
                    }}
                  >
                    <Disc3 className="w-2.5 h-2.5 animate-spin" />
                    {activeBuff.badge}
                  </span>
                </h3>
                <p className="text-[10px] text-slate-300 font-medium">
                  {currentTheme.tagline}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                sounds.playTap();
                onClose();
              }}
              className="w-7 h-7 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-white/10"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Spotify Connection & Playing Track Card */}
          <div className="bg-slate-950/80 backdrop-blur-md border border-white/10 rounded-xl p-3 flex flex-col gap-2.5 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Radio
                  className={`w-3.5 h-3.5 ${isConnected ? 'text-[#1DB954] animate-pulse' : 'text-slate-500'}`}
                />
                Spotify Entegrasyonu
              </span>

              {isConnected ? (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-[#1DB954] bg-[#1DB954]/10 px-2 py-0.5 rounded-full border border-[#1DB954]/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Bağlandı
                  </span>
                  <button
                    onClick={handleDisconnect}
                    className="text-[10px] text-slate-400 hover:text-rose-400 underline transition-colors cursor-pointer"
                  >
                    Çıkış
                  </button>
                </div>
              ) : (
                <span className="text-[10px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-700">
                  Bağlı Değil
                </span>
              )}
            </div>

            {/* Currently Playing Track with Themed Card */}
            {isConnected && currentTrack ? (
              <div
                className={`bg-slate-900/90 border rounded-xl p-2.5 flex flex-col gap-2 transition-all duration-300 ${currentTheme.cardBorder}`}
              >
                <div className="flex items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {currentTrack.albumArt ? (
                      <div className="relative shrink-0">
                        <img
                          src={currentTrack.albumArt}
                          alt={currentTrack.name}
                          className="w-12 h-12 rounded-lg object-cover border border-white/20 shadow-md"
                        />
                        {isPlaying && (
                          <div className="absolute -bottom-1 -right-1 bg-black/80 rounded-full p-0.5 border border-white/20">
                            <span className="flex gap-0.5 items-end h-2 px-1">
                              <span
                                className="w-0.5 h-2 animate-bounce"
                                style={{ backgroundColor: currentTheme.accentColor }}
                              />
                              <span
                                className="w-0.5 h-3 animate-bounce [animation-delay:0.15s]"
                                style={{ backgroundColor: currentTheme.accentColor }}
                              />
                              <span
                                className="w-0.5 h-1.5 animate-bounce [animation-delay:0.3s]"
                                style={{ backgroundColor: currentTheme.accentColor }}
                              />
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div
                        className={`w-12 h-12 rounded-lg bg-gradient-to-br ${currentTheme.coverPlaceholder} border flex items-center justify-center shrink-0 shadow-md`}
                        style={{ borderColor: currentTheme.accentColor }}
                      >
                        <Music className="w-5 h-5 text-white" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate flex items-center gap-1">
                        <span>{currentTrack.name}</span>
                      </div>
                      <div className="text-[10px] text-slate-300 truncate">{currentTrack.artist}</div>
                      {currentTrack.albumName && (
                        <div className="text-[9px] text-slate-400 truncate opacity-80">
                          {currentTrack.albumName}
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => fetchNowPlaying()}
                    title="Şarkıyı ve Temayı Yenile"
                    className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center shrink-0 transition-colors cursor-pointer border border-white/10"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Detected Genre & Auto-Theme Badge */}
                <div className="flex items-center justify-between pt-1 border-t border-white/10 text-[10px]">
                  <div className="flex items-center gap-1.5 text-slate-300 truncate">
                    <Tag className="w-3 h-3" style={{ color: currentTheme.accentColor }} />
                    <span>Algılanan Tür & Tema:</span>
                    <span className="font-bold" style={{ color: currentTheme.accentColor }}>
                      {currentTrack.detectedGenre ? MUSIC_BUFFS[currentTrack.detectedGenre]?.name : activeBuff.name}
                    </span>
                  </div>
                  <span
                    className="text-[9px] px-1.5 py-0.2 rounded border font-bold shrink-0"
                    style={{
                      backgroundColor: `${currentTheme.accentColor}20`,
                      color: currentTheme.accentColor,
                      borderColor: `${currentTheme.accentColor}40`,
                    }}
                  >
                    Buff Aktif
                  </span>
                </div>
              </div>
            ) : isConnected ? (
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-2.5 text-center flex items-center justify-between">
                <span className="text-[11px] text-slate-400">Şu an Spotify'da parça çalmıyor.</span>
                <button
                  onClick={() => fetchNowPlaying()}
                  className="text-[10px] font-semibold flex items-center gap-1 cursor-pointer"
                  style={{ color: currentTheme.accentColor }}
                >
                  <RefreshCw className="w-3 h-3" /> Kontrol Et
                </button>
              </div>
            ) : (
              <button
                onClick={handleConnectSpotify}
                disabled={isConnecting}
                className="w-full py-2.5 px-3 rounded-xl bg-[#1DB954] hover:bg-[#1aa34a] active:scale-98 text-black font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Music className="w-4 h-4 text-black fill-black" />
                <span>{isConnecting ? 'Bağlanılıyor...' : 'Kişisel Spotify Hesabını Bağla (OAuth)'}</span>
              </button>
            )}

            {/* Active Server Status Bar & Settings Toggle */}
            <div className="bg-slate-900/70 border border-white/10 rounded-lg p-2 flex flex-col gap-2">
              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Server className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-slate-300 font-medium truncate">
                    Sunucu: <span className="text-white font-mono text-[10px]">{activeServerUrl ? activeServerUrl.replace(/^https?:\/\//, '') : 'Otomatik / Aynı Domain'}</span>
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="flex items-center gap-1 text-[10px]">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        serverHealth?.isOnline
                          ? 'bg-emerald-400 animate-pulse'
                          : isCheckingServer
                          ? 'bg-amber-400 animate-ping'
                          : 'bg-rose-400'
                      }`}
                    />
                    <span className={serverHealth?.isOnline ? 'text-emerald-400' : 'text-slate-400'}>
                      {isCheckingServer ? 'Kontrol...' : serverHealth?.isOnline ? 'Çevrimiçi' : 'Çevrimdışı'}
                    </span>
                  </span>
                  <button
                    onClick={() => {
                      sounds.playTap();
                      setShowServerSettings(prev => !prev);
                    }}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                    title="Vercel & Sunucu Ayarları"
                  >
                    <Settings2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Expandable Vercel / Backend Server Configuration */}
              {showServerSettings && (
                <div className="pt-2 border-t border-white/10 flex flex-col gap-2 animate-in fade-in duration-150">
                  <div className="text-[10px] text-slate-300">
                    Spotify kimlik doğrulaması ve veri senkronizasyonu için Vercel veya özel sunucu URL'nizi belirleyin:
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={customServerInput}
                        onChange={e => setCustomServerInput(e.target.value)}
                        placeholder="https://yksmezunlatest.vercel.app"
                        className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-[11px] text-white font-mono focus:border-emerald-500 focus:outline-none"
                      />
                      <button
                        onClick={() => handleTestAndSaveServer(customServerInput)}
                        disabled={testingServer}
                        className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-[10px] rounded-lg transition-colors cursor-pointer shrink-0"
                      >
                        {testingServer ? 'Test...' : 'Test & Kaydet'}
                      </button>
                    </div>

                    {/* Quick Presets */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[9px] text-slate-400">Hızlı Seçim:</span>
                      <button
                        onClick={() => {
                          setCustomServerInput('https://yksmezunlatest.vercel.app');
                          handleTestAndSaveServer('https://yksmezunlatest.vercel.app');
                        }}
                        className="text-[9px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 transition-colors cursor-pointer"
                      >
                        Vercel Sunucusu
                      </button>
                      <button
                        onClick={handleResetToAuto}
                        className="text-[9px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 transition-colors cursor-pointer"
                      >
                        Otomatik Algıla
                      </button>
                    </div>

                    {testResult && (
                      <div className="text-[10px] p-2 rounded bg-slate-950/80 border border-slate-800 leading-snug">
                        {testResult}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Developer Setup Info if Spotify credentials not configured */}
            {!isConnected && (
              <div className="bg-amber-950/40 border border-amber-500/30 rounded-lg p-2.5 text-[11px] text-amber-200 flex flex-col gap-2">
                <div className="flex items-center justify-between text-amber-400 font-bold">
                  <span className="flex items-center gap-1">
                    <Info className="w-3.5 h-3.5 shrink-0" />
                    <span>Spotify Developer Dashboard Kurulumu:</span>
                  </span>
                  <a
                    href="https://developer.spotify.com/dashboard"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-amber-300 hover:text-white underline flex items-center gap-0.5"
                  >
                    <span>Paneli Aç</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <p className="text-[10px] text-slate-300 leading-relaxed">
                  Spotify App ayarlarınızda (Settings) <strong>Redirect URIs</strong> listesine aşağıdaki adresleri ekleyin:
                </p>

                {/* LDPlayer / Mobile APK Redirect URI */}
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] text-sky-400 font-semibold flex items-center gap-1">
                    <Smartphone className="w-3 h-3" /> LDPlayer & Mobil APK İçin:
                  </span>
                  <div className="flex items-center justify-between bg-slate-900 border border-slate-700 rounded px-2 py-1 font-mono text-[9px] text-slate-200">
                    <span className="truncate mr-2">https://localhost/auth/callback</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText('https://localhost/auth/callback');
                        sounds.playTap();
                        setStatusMessage('https://localhost/auth/callback kopyalandı!');
                      }}
                      className="text-amber-400 hover:text-white flex items-center gap-0.5 shrink-0 cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Kopyala</span>
                    </button>
                  </div>
                </div>

                {/* Vercel / Web Redirect URI */}
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] text-emerald-400 font-semibold flex items-center gap-1">
                    <Globe className="w-3 h-3" /> Vercel & Web Tarayıcı İçin:
                  </span>
                  <div className="flex items-center justify-between bg-slate-900 border border-slate-700 rounded px-2 py-1 font-mono text-[9px] text-slate-200">
                    <span className="truncate mr-2">https://yksmezunlatest.vercel.app/auth/callback</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText('https://yksmezunlatest.vercel.app/auth/callback');
                        sounds.playTap();
                        setStatusMessage('https://yksmezunlatest.vercel.app/auth/callback kopyalandı!');
                      }}
                      className="text-amber-400 hover:text-white flex items-center gap-0.5 shrink-0 cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Kopyala</span>
                    </button>
                  </div>
                </div>

                <div className="text-[9px] text-slate-400 bg-slate-900/60 rounded p-1.5 border border-white/5">
                  💡 <strong>İpucu:</strong> Spotify Developer paneline bu iki adresi de eklerseniz hem emülatörde/telefonda hem de bilgisayarda tek tıkla doğrudan bağlanabilirsiniz.
                </div>
              </div>
            )}

            {statusMessage && (
              <div
                className="text-[10px] rounded p-1.5 text-center font-medium border"
                style={{
                  backgroundColor: `${currentTheme.accentColor}15`,
                  color: currentTheme.accentColor,
                  borderColor: `${currentTheme.accentColor}30`,
                }}
              >
                {statusMessage}
              </div>
            )}

            {/* Android APK Automatic Cloud Indicator */}
            {isApk && (
              <div className="pt-1 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Smartphone className="w-3 h-3 text-sky-400" />
                  <span className="text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Otomatik Bulut Senkronizasyonu Aktif
                  </span>
                </span>
                <span className="text-[9px] text-slate-400">Canlı Bağlantı</span>
              </div>
            )}
          </div>

          {/* Current Active Buff & Aesthetic Mood Banner */}
          <div
            className={`p-3 rounded-xl border bg-gradient-to-r flex flex-col gap-1.5 shadow-md transition-all duration-300 ${activeBuff.color}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 text-white">
                <Volume2 className="w-3.5 h-3.5" />
                Aktif Mezun Avantajı (Buff)
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-950/70 border border-white/20 text-white">
                {activeBuff.badge}
              </span>
            </div>

            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              {renderGenreIcon(activeGenre)}
              <span>{activeBuff.name}</span>
            </div>
            <p className="text-[11px] text-slate-200 leading-snug">
              {activeBuff.bonusSummary}
            </p>
          </div>

          {/* Select Music Genre & Theme Picker */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                Müzik Türü & Atmosfer Teması:
              </span>
              <span className="text-[10px] text-slate-400">8 Özel Stil</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {DISPLAY_GENRES.map(genreKey => {
                const info = MUSIC_BUFFS[genreKey];
                if (!info) return null;
                const isSelected = activeGenre === genreKey;
                const genreTheme = info.theme;

                return (
                  <button
                    key={genreKey}
                    onClick={() => {
                      sounds.playTap();
                      onSelectGenre(genreKey);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all duration-200 cursor-pointer relative flex flex-col justify-between gap-1.5 overflow-hidden group ${
                      isSelected
                        ? 'bg-slate-900/90 shadow-md ring-1'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900/50'
                    }`}
                    style={{
                      borderColor: isSelected && genreTheme ? genreTheme.accentColor : undefined,
                      boxShadow: isSelected && genreTheme ? `0 0 16px ${genreTheme.accentColor}30` : undefined,
                    }}
                  >
                    {/* Subtle aesthetic backdrop for each button */}
                    {genreTheme?.ambientBgUrl && (
                      <div
                        className="absolute inset-0 bg-cover bg-center opacity-10 group-hover:opacity-20 transition-opacity duration-300 pointer-events-none -z-0"
                        style={{ backgroundImage: `url(${genreTheme.ambientBgUrl})` }}
                      />
                    )}

                    <div className="flex items-center justify-between relative z-10">
                      <div
                        className="w-6 h-6 rounded-lg flex items-center justify-center border"
                        style={{
                          backgroundColor: `${genreTheme?.accentColor || '#64748b'}20`,
                          borderColor: `${genreTheme?.accentColor || '#64748b'}40`,
                        }}
                      >
                        {renderGenreIcon(genreKey, 'w-3.5 h-3.5')}
                      </div>
                      {isSelected && (
                        <span
                          className="w-2 h-2 rounded-full animate-ping"
                          style={{ backgroundColor: genreTheme?.accentColor || '#10b981' }}
                        />
                      )}
                    </div>

                    <div className="relative z-10">
                      <div className="text-[11px] font-bold text-white leading-tight">
                        {info.name}
                      </div>
                      <div
                        className="text-[9px] mt-0.5 font-semibold"
                        style={{ color: genreTheme?.accentColor || '#10b981' }}
                      >
                        {info.badge}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
