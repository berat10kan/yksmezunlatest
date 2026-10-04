/**
 * Smart automatic backend discovery and client-side fallback.
 * Checks available endpoints and automatically selects the first working backend without user manual input.
 */

export const CANDIDATE_BACKEND_URLS = [
  'https://yksmezunlatest.vercel.app',
  'https://ais-dev-owju2w5bwashzmxukeajzg-584946353104.europe-west2.run.app',
  'https://ais-pre-owju2w5bwashzmxukeajzg-584946353104.europe-west2.run.app',
];

export const BACKEND_URL_KEY = 'mezun_backend_server_url';
let cachedWorkingBaseUrl: string | null = null;
let discoveryPromise: Promise<string> | null = null;

/**
 * Accurately determines if running inside a native mobile hybrid shell (Capacitor/Cordova)
 * rather than a standard web browser on desktop or mobile.
 */
export const isNativeAndroidApp = (): boolean => {
  if (typeof window === 'undefined') return false;

  // 1. Official Capacitor native platform check
  const cap = (window as any).Capacitor;
  if (cap && typeof cap.isNativePlatform === 'function') {
    return cap.isNativePlatform();
  }
  if (cap && typeof cap.getPlatform === 'function') {
    return cap.getPlatform() !== 'web';
  }

  // 2. Protocols used specifically by hybrid webviews
  if (window.location.protocol === 'capacitor:' || window.location.protocol === 'ionic:') {
    return true;
  }

  // 3. Android Capacitor webview origin (https://localhost strictly without port)
  if (window.location.origin === 'https://localhost' && !window.location.port) {
    return true;
  }

  return false;
};

/**
 * Returns current known backend base URL immediately.
 */
export const getBackendBaseUrl = (): string => {
  if (typeof window === 'undefined') return '';

  // If user explicitly saved a custom server URL in localStorage, prioritize it
  const saved = localStorage.getItem(BACKEND_URL_KEY);
  if (saved && saved.trim()) {
    return saved.trim().replace(/\/+$/, '');
  }

  // In web browsers, same origin relative paths work natively out of the box
  if (!isNativeAndroidApp()) {
    return '';
  }

  if (cachedWorkingBaseUrl) return cachedWorkingBaseUrl;

  return CANDIDATE_BACKEND_URLS[0] || '';
};

/**
 * Health check helper for any backend URL.
 * Tests if /api/spotify/status is responding and returns configuration details.
 */
export interface BackendHealthInfo {
  url: string;
  isOnline: boolean;
  configured: boolean;
  redirectUri?: string;
  clientId?: string | null;
  error?: string;
}

export const checkBackendHealth = async (urlToCheck?: string): Promise<BackendHealthInfo> => {
  const target = urlToCheck !== undefined ? urlToCheck.trim().replace(/\/+$/, '') : getBackendBaseUrl();
  const endpoint = target ? `${target}/api/spotify/status` : '/api/spotify/status';

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(endpoint, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      return {
        url: target || (typeof window !== 'undefined' ? window.location.origin : ''),
        isOnline: true,
        configured: Boolean(data.configured),
        redirectUri: data.redirectUri,
        clientId: data.clientId,
      };
    }

    return {
      url: target,
      isOnline: false,
      configured: false,
      error: `HTTP ${res.status}: Sunucu yanıt vermedi`,
    };
  } catch (err: any) {
    return {
      url: target,
      isOnline: false,
      configured: false,
      error: err.name === 'AbortError' ? 'Zaman aşımı (4s)' : (err.message || 'Bağlantı kurulamadı'),
    };
  }
};

/**
 * Automatically pings candidate servers in parallel with a short timeout
 * and selects whichever is alive, saving it automatically into localStorage.
 */
export const autoDiscoverWorkingBackendUrl = async (): Promise<string> => {
  if (typeof window === 'undefined') {
    return '';
  }

  // In web environment without explicit custom server, same-origin is preferred
  const currentSaved = localStorage.getItem(BACKEND_URL_KEY);
  if (!isNativeAndroidApp() && (!currentSaved || !currentSaved.trim())) {
    return '';
  }

  if (cachedWorkingBaseUrl) {
    return cachedWorkingBaseUrl;
  }

  if (discoveryPromise) {
    return discoveryPromise;
  }

  discoveryPromise = (async () => {
    const urlsToTest = [
      currentSaved,
      ...CANDIDATE_BACKEND_URLS,
    ].filter(Boolean).map(u => u!.trim().replace(/\/+$/, ''));

    // Deduplicate
    const uniqueUrls = Array.from(new Set(urlsToTest));

    for (const url of uniqueUrls) {
      if (!url) continue;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);

        const res = await fetch(`${url}/api/spotify/status`, {
          method: 'GET',
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          cachedWorkingBaseUrl = url;
          localStorage.setItem(BACKEND_URL_KEY, url);
          return url;
        }
      } catch {
        // try next candidate
      }
    }

    // Default fallback if all offline or in flight
    const fallback = CANDIDATE_BACKEND_URLS[0] || '';
    cachedWorkingBaseUrl = fallback;
    return fallback;
  })();

  const result = await discoveryPromise;
  discoveryPromise = null;
  return result;
};

/**
 * Robust fetch that automatically routes through the active working backend
 * and retries on fallback candidate if the first candidate fails.
 */
export const fetchFromBackend = async (
  apiPath: string,
  options?: RequestInit
): Promise<Response> => {
  const cleanPath = apiPath.startsWith('/') ? apiPath : `/${apiPath}`;
  const customServer = localStorage.getItem(BACKEND_URL_KEY)?.trim()?.replace(/\/+$/, '');

  // 1. If custom server is explicitly configured, use it first
  if (customServer) {
    try {
      const res = await fetch(`${customServer}${cleanPath}`, options);
      if (res.ok || res.status < 500) {
        return res;
      }
    } catch {
      // fallback
    }
  }

  // 2. In web browsers without custom server, use same-origin relative path
  if (!isNativeAndroidApp()) {
    try {
      const res = await fetch(cleanPath, options);
      if (res.ok || res.status < 500) {
        return res;
      }
    } catch {
      // fallback to candidate URLs
    }
  }

  // 3. Mobile APK: try primary discovered base
  let baseUrl = await autoDiscoverWorkingBackendUrl();
  try {
    const targetUrl = baseUrl ? `${baseUrl}${cleanPath}` : cleanPath;
    const res = await fetch(targetUrl, options);
    if (res.ok || res.status < 500) {
      return res;
    }
    throw new Error(`HTTP ${res.status}`);
  } catch (err) {
    // Try other candidates automatically
    const otherCandidates = CANDIDATE_BACKEND_URLS.filter(u => u !== baseUrl);
    for (const altUrl of otherCandidates) {
      try {
        const altRes = await fetch(`${altUrl}${cleanPath}`, options);
        if (altRes.ok || altRes.status < 500) {
          cachedWorkingBaseUrl = altUrl;
          localStorage.setItem(BACKEND_URL_KEY, altUrl);
          return altRes;
        }
      } catch {
        // continue
      }
    }
    throw err;
  }
};

export const setBackendBaseUrl = (url: string) => {
  if (typeof window === 'undefined') return;
  if (!url || !url.trim()) {
    localStorage.removeItem(BACKEND_URL_KEY);
    cachedWorkingBaseUrl = null;
  } else {
    const clean = url.trim().replace(/\/+$/, '');
    localStorage.setItem(BACKEND_URL_KEY, clean);
    cachedWorkingBaseUrl = clean;
  }
};
