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
} from '../../utils/backendConfig';
import { Smartphone, ExternalLink, Globe } from 'lucide-react';

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
  const [customServerInput, setCustomServerInput] = useState('');
  const [showServerSettings, setShowServerSettings] = useState(false);
  const isApk = isNativeAndroidApp();

  // Check server spotify status on mount
  useEffect(() => {
    if (!isOpen) return;

    const checkStatus = async () => {
      setIsCheckingServer(true);
      try {
        const res = await fetchFromBackend('/api/spotify/status');
        if (res.ok) {
          const data = await res.json();
          setServerConfigured(data.configured);
          setRedirectUri(data.redirectUri || `${window.location.origin}/auth/callback`);
        }
      } catch {
        setServerConfigured(false);
      } finally {
        setIsCheckingServer(false);
      }

      // Check if we have a saved token
      const savedToken = localStorage.getItem(SPOTIFY_TOKEN_KEY);
      if (savedToken) {
        setIsConnected(true);
        fetchNowPlaying(savedToken);
      }
    };

    checkStatus();
  }, [isOpen]);

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
            const exchangeRes = await fetchFromBackend('/api/spotify/exchange-token', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ code }),
            });

            if (!exchangeRes.ok) {
              const errData = await exchangeRes.json();
              throw new Error(errData.error || 'Token değişimi başarısız oldu');
            }

            const tokenData = await exchangeRes.json();
            localStorage.setItem(SPOTIFY_TOKEN_KEY, tokenData.access_token);
            if (tokenData.refresh_token) {
              localStorage.setItem(SPOTIFY_REFRESH_KEY, tokenData.refresh_token);
            }

            setIsConnected(true);
            setIsConnecting(false);
            setStatusMessage('Spotify hesabın başarıyla bağlandı! 🎧');
            sounds.playSuccess();
            fetchNowPlaying(tokenData.access_token);
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
  }, []);

  // Fetch currently playing track from Spotify API
  const fetchNowPlaying = async (token?: string) => {
    const authToken = token || localStorage.getItem(SPOTIFY_TOKEN_KEY);
    if (!authToken) return;

    try {
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
        if (data.track) {
          // Detect genre using both title keywords and Spotify artist genres
          const detected = detectGenreFromTrack(
            data.track.name,
            data.track.artist,
            data.track.albumName || '',
            data.track.artistGenres || []
          );

          const trackWithGenre: SpotifyTrack = {
            ...data.track,
            detectedGenre: detected,
          };

          setCurrentTrack(trackWithGenre);
          setIsPlaying(data.isPlaying);

          // Automatically apply detected buff to the game
          onSelectGenre(detected, trackWithGenre);
          const buff = MUSIC_BUFFS[detected];
          setStatusMessage(`Çalan: ${data.track.name} [${buff.name}: ${buff.badge}] otomatik uygulandı!`);
        } else {
          setCurrentTrack(null);
          setIsPlaying(false);
          setStatusMessage("Şu an Spotify'da bir parça çalmıyor. Müzik açtığında otomatik algılanır.");
        }
      }
    } catch (err: any) {
      console.error('Spotify fetch error:', err);
    }
  };

  // Trigger Spotify Connect OAuth
  const handleConnectSpotify = async () => {
    try {
      setIsConnecting(true);
      setStatusMessage('Aktif bulut sunucusu otomatik taranıyor ve bağlanılıyor...');

      const res = await fetchFromBackend('/api/spotify/auth-url');
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Auth URL alınamadı' }));
        throw new Error(err.error || 'Auth URL alınamadı');
      }

      const { url } = await res.json();

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
      setStatusMessage(`Bağlantı hatası: ${err.message}. APK modunda sunucu URL'sinin erişilebilir olduğundan emin olun.`);
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

            {/* Developer Setup Info if Spotify credentials not configured */}
            {serverConfigured === false && !isConnected && (
              <div className="bg-amber-950/40 border border-amber-500/30 rounded-lg p-2.5 text-[11px] text-amber-200 flex flex-col gap-1.5">
                <div className="flex items-center gap-1 text-amber-400 font-bold">
                  <Info className="w-3.5 h-3.5 shrink-0" />
                  <span>Spotify Developer Kurulumu:</span>
                </div>
                <p className="text-[10px] text-slate-300 leading-relaxed">
                  Spotify App ayarlarınızda <strong>Redirect URI</strong> olarak şunu kaydedin:
                </p>
                <div className="flex items-center justify-between bg-slate-900 border border-slate-700 rounded px-2 py-1 font-mono text-[9px] text-slate-200">
                  <span className="truncate mr-2">{redirectUri || `${window.location.origin}/auth/callback`}</span>
                  <button
                    onClick={copyCallbackUrl}
                    className="text-amber-400 hover:text-white flex items-center gap-0.5 shrink-0"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedUrl ? 'Kopyalandı' : 'Kopyala'}</span>
                  </button>
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
