import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { estimateGoalIntelligently } from './src/utils/intelligentEstimator.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json());

  // Enable CORS for API requests from Android WebView (https://localhost / capacitor://localhost)
  app.use((req: Request, res: Response, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Helper to determine redirect URI for Spotify OAuth
  const getRedirectUri = (req: Request) => {
    if (process.env.APP_URL) {
      const cleanUrl = process.env.APP_URL.replace(/\/+$/, '');
      return `${cleanUrl}/auth/callback`;
    }
    const host = req.get('host') || `localhost:${PORT}`;
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    return `${protocol}://${host}/auth/callback`;
  };

  // 1. Spotify OAuth Configuration & Status
  app.get('/api/spotify/status', (req: Request, res: Response) => {
    const isConfigured = Boolean(process.env.SPOTIFY_CLIENT_ID);
    const redirectUri = getRedirectUri(req);
    res.json({
      configured: isConfigured,
      clientId: process.env.SPOTIFY_CLIENT_ID || null,
      redirectUri,
    });
  });

  // 2. Generate Spotify Authorization URL
  app.get('/api/spotify/auth-url', (req: Request, res: Response) => {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    if (!clientId) {
      return res.status(400).json({
        error: 'SPOTIFY_CLIENT_ID is not configured in environment variables.',
      });
    }

    const redirectUri = getRedirectUri(req);
    const scopes = [
      'user-read-currently-playing',
      'user-read-playback-state',
      'user-read-recently-played',
      'user-top-read',
    ].join(' ');

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      scope: scopes,
      redirect_uri: redirectUri,
      show_dialog: 'true',
    });

    const authUrl = `https://accounts.spotify.com/authorize?${params.toString()}`;
    res.json({ url: authUrl, redirectUri });
  });

  // 3. OAuth Callback handler (Popup communicates with opener via postMessage)
  const callbackHandler = (req: Request, res: Response) => {
    const { code, error } = req.query;

    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Spotify Girişi Tamamlanıyor...</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              background-color: #090d16;
              color: #e2e8f0;
              text-align: center;
            }
            .card {
              background: #131c2e;
              padding: 28px;
              border-radius: 16px;
              border: 1px solid #1db954;
              box-shadow: 0 10px 25px rgba(0,0,0,0.5);
              max-width: 380px;
            }
            .spinner {
              width: 32px;
              height: 32px;
              border: 3px solid rgba(29, 185, 84, 0.2);
              border-top-color: #1db954;
              border-radius: 50%;
              animation: spin 0.8s linear infinite;
              margin: 0 auto 16px;
            }
            @keyframes spin { to { transform: rotate(360deg); } }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="spinner"></div>
            <h3 style="margin: 0 0 8px; color: #1db954;">Spotify Bağlantısı Başarılı!</h3>
            <p style="margin: 0 0 16px; font-size: 13px; color: #94a3b8;">
              Pencere otomatik olarak kapatılıyor ve Mezun Tycoon'a aktarılıyor...
            </p>
            <div id="fallbackSection" style="display:none; text-align: left; background: #0b1120; padding: 12px; border-radius: 8px; border: 1px solid #334155;">
              <p style="margin: 0 0 8px; font-size: 11px; color: #cbd5e1;">Eğer uygulama otomatik açılmadıysa aşağıdaki butona dokunun:</p>
              <a id="deepLinkBtn" href="#" style="display: block; text-align: center; background: #1db954; color: #000; font-weight: bold; padding: 10px; border-radius: 8px; text-decoration: none; font-size: 13px;">Uygulamaya Geri Dön</a>
            </div>
          </div>
          <script>
            (function() {
              const code = ${JSON.stringify(code || null)};
              const error = ${JSON.stringify(error || null)};
              
              if (window.opener) {
                try {
                  window.opener.postMessage({
                    type: 'SPOTIFY_AUTH_CALLBACK',
                    code: code,
                    error: error
                  }, '*');
                  setTimeout(() => window.close(), 600);
                  return;
                } catch(e) {}
              }

              // In Android Chrome/CustomTabs, try redirecting back to APK via custom scheme:
              if (code) {
                const deepUrl = 'com.mezunyks.app://auth/callback?code=' + encodeURIComponent(code);
                const deepLinkBtn = document.getElementById('deepLinkBtn');
                if (deepLinkBtn) deepLinkBtn.href = deepUrl;
                document.getElementById('fallbackSection').style.display = 'block';

                try {
                  window.location.href = deepUrl;
                } catch (e) {}
              } else if (error) {
                const deepUrl = 'com.mezunyks.app://auth/callback?error=' + encodeURIComponent(error);
                try { window.location.href = deepUrl; } catch (e) {}
              }
            })();
          </script>
        </body>
      </html>
    `);
  };

  app.get(['/auth/callback', '/auth/callback/'], callbackHandler);

  // 4. Exchange Auth Code for Access Token
  app.post('/api/spotify/exchange-token', async (req: Request, res: Response) => {
    try {
      const { code } = req.body;
      const clientId = process.env.SPOTIFY_CLIENT_ID;
      const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        return res.status(400).json({
          error: 'Spotify Client ID veya Secret sunucuda tanımlanmamış.',
        });
      }

      if (!code) {
        return res.status(400).json({ error: 'Code parametresi eksik.' });
      }

      const redirectUri = getRedirectUri(req);
      const tokenParams = new URLSearchParams({
        grant_type: 'authorization_code',
        code: String(code),
        redirect_uri: redirectUri,
      });

      const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
      const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${authHeader}`,
        },
        body: tokenParams.toString(),
      });

      const tokenData = await tokenResponse.json();
      if (!tokenResponse.ok) {
        return res.status(tokenResponse.status).json(tokenData);
      }

      res.json(tokenData);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Token değişimi başarısız oldu' });
    }
  });

  // In-memory cache for Spotify artist genres to keep responses fast
  const artistGenresCache = new Map<string, string[]>();

  const getArtistGenres = async (artistId: string | undefined, token: string): Promise<string[]> => {
    if (!artistId) return [];
    if (artistGenresCache.has(artistId)) {
      return artistGenresCache.get(artistId)!;
    }
    try {
      const res = await fetch(`https://api.spotify.com/v1/artists/${artistId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const genres: string[] = data.genres || [];
        artistGenresCache.set(artistId, genres);
        return genres;
      }
    } catch {
      // ignore
    }
    return [];
  };

  // 5. Fetch Currently Playing Track & Musical Mood
  app.get('/api/spotify/current-track', async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ error: 'Authorization header eksik.' });
      }

      const token = authHeader.replace(/^Bearer\s+/i, '');
      const spotifyRes = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (spotifyRes.status === 204 || spotifyRes.status === 404) {
        // Player is idle, fetch recently played as fallback
        const recentRes = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=1', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (recentRes.ok) {
          const recentData = await recentRes.json();
          if (recentData.items && recentData.items.length > 0) {
            const item = recentData.items[0].track;
            const primaryArtistId = item.artists?.[0]?.id;
            const artistGenres = await getArtistGenres(primaryArtistId, token);

            return res.json({
              isPlaying: false,
              isRecent: true,
              track: {
                id: item.id,
                name: item.name,
                artist: item.artists?.map((a: any) => a.name).join(', '),
                artistId: primaryArtistId,
                artistGenres: artistGenres,
                albumName: item.album?.name,
                albumArt: item.album?.images?.[0]?.url,
                progressMs: 0,
                durationMs: item.duration_ms,
                spotifyUrl: item.external_urls?.spotify,
              },
            });
          }
        }

        return res.json({ isPlaying: false, track: null });
      }

      if (!spotifyRes.ok) {
        const errorText = await spotifyRes.text();
        return res.status(spotifyRes.status).send(errorText);
      }

      const data = await spotifyRes.json();
      if (!data.item) {
        return res.json({ isPlaying: false, track: null });
      }

      const primaryArtistId = data.item.artists?.[0]?.id;
      const artistGenres = await getArtistGenres(primaryArtistId, token);

      res.json({
        isPlaying: data.is_playing,
        track: {
          id: data.item.id,
          name: data.item.name,
          artist: data.item.artists?.map((a: any) => a.name).join(', '),
          artistId: primaryArtistId,
          artistGenres: artistGenres,
          albumName: data.item.album?.name,
          albumArt: data.item.album?.images?.[0]?.url,
          progressMs: data.progress_ms,
          durationMs: data.item.duration_ms,
          spotifyUrl: data.item.external_urls?.spotify,
        },
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Spotify parçası alınamadı' });
    }
  });

  // 6. AI Goal Estimator & Analyzer using Gemini API (gemini-3.8-flash)
  const aiClient = new GoogleGenAI();

  app.post('/api/ai/estimate-goal', async (req: Request, res: Response) => {
    try {
      const { university, major, city, notes } = req.body;

      if (!university && !major) {
        return res.status(400).json({
          error: 'Lütfen en az bir üniversite veya bölüm adı belirtin.',
        });
      }

      const prompt = `Sen Türkiye YKS (Yükseköğretim Kurumları Sınavı), ÖSYM ve YÖK Atlas verileri konusunda uzmanlaşmış bir eğitim yapay zekasısın.
Öğrencinin girmek istediği hedef:
- Üniversite: "${university || 'Belirtilmedi'}"
- Bölüm / Program: "${major || 'Belirtilmedi'}"
- Tercih Edilen Şehir: "${city || ''}"
- Ek Notlar: "${notes || ''}"

GÖREVİN:
Bu üniversite ve bölümün Türkiye YKS şartlarındaki gerçekçi YÖK Atlas taban sıralamasını, puan türünü (SAY, EA, SOZ veya DIL) ve gerekli yaklaşık TYT & AYT netlerini tespit edip JSON olarak döndürmek.

Önemli kurallar:
1. Puan türü (field) sadece "SAY", "EA", "SOZ" veya "DIL" olabilir.
   - Örn: Tıp, Mühendislikler, Diş, Hemşirelik, Mimarlık -> SAY
   - Hukuk, Psikoloji, İşletme, İktisat, YBS -> EA
   - İlahiyat, Tarih, Coğrafya, İletişim, Gastronomi -> SOZ
   - İngiliz Dili ve Edebiyatı, Mütercim Tercümanlık -> DIL
2. Sıralama (targetRank) pozitif bir tamsayı olmalıdır. (Örn: Boğaziçi Bilgisayar için ~300, ODTÜ Makine için ~5500, Hacettepe Tıp için ~1200, Ankara Hukuk için ~3500 vb.)
3. requiredTytNet: TYT neti (0 - 120 arası sayı, örn 102.5)
4. requiredAytNet: AYT neti (0 - 80 arası sayı, örn 71.0)
5. motivationTip: Öğrenciye özel, seçtiği bölüme dair 1-2 cümlelik gerçekçi ve motive edici YKS koçluk tavsiyesi.

SADECE geçerli bir JSON objesi döndür, markdown veya başka açıklama ekleme:
{
  "university": "Tam Resmi Üniversite Adı",
  "major": "Tam Resmi Bölüm Adı",
  "city": "Şehir",
  "field": "SAY" | "EA" | "SOZ" | "DIL",
  "targetRank": 12500,
  "requiredTytNet": 94.5,
  "requiredAytNet": 63.0,
  "motivationTip": "Kısa koçluk tavsiyesi..."
}`;

      let parsedData: any = null;

      try {
        const response = await aiClient.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
        });

        const responseText = response.text || '{}';
        parsedData = JSON.parse(responseText.trim());
      } catch (geminiErr: any) {
        console.warn('[Gemini API Warning, using Intelligent Estimator fallback]:', geminiErr.message);
        // Fallback gracefully using our deep YÖK Atlas Intelligent Estimator!
        parsedData = estimateGoalIntelligently(university || '', major || '', city || '');
      }

      if (!parsedData || !parsedData.targetRank) {
        parsedData = estimateGoalIntelligently(university || '', major || '', city || '');
      }

      res.json({
        success: true,
        data: parsedData,
      });
    } catch (err: any) {
      console.error('[AI Goal Estimator Error]:', err);
      // Final fallback so user never gets blocked by billing or connection issues
      const fallback = estimateGoalIntelligently(req.body?.university || '', req.body?.major || '', req.body?.city || '');
      res.json({
        success: true,
        data: fallback,
      });
    }
  });

  // 7. Vite middleware for frontend development
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static files
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Mezun Tycoon Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
