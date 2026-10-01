/**
 * Smart automatic backend discovery and client-side fallback.
 * Checks available endpoints and automatically selects the first working backend without user manual input.
 */

const CANDIDATE_BACKEND_URLS = [
  'https://yksmezunlatest.vercel.app',
];

const BACKEND_URL_KEY = 'mezun_backend_server_url';
let cachedWorkingBaseUrl: string | null = null;
let discoveryPromise: Promise<string> | null = null;

export const isNativeAndroidApp = (): boolean => {
  if (typeof window === 'undefined') return false;
  const origin = window.location.origin;
  return (
    origin.includes('localhost') ||
    origin.includes('capacitor://') ||
    origin.startsWith('https://localhost') ||
    (window as any).Capacitor !== undefined
  );
};

/**
 * Returns current known backend base URL immediately.
 */
export const getBackendBaseUrl = (): string => {
  if (typeof window === 'undefined') return '';
  if (!isNativeAndroidApp()) return ''; // In web, relative paths to same origin work natively!

  if (cachedWorkingBaseUrl) return cachedWorkingBaseUrl;

  const saved = localStorage.getItem(BACKEND_URL_KEY);
  if (saved && saved.trim()) {
    return saved.replace(/\/+$/, '');
  }

  return CANDIDATE_BACKEND_URLS[0];
};

/**
 * Automatically pings candidate servers in parallel with a short timeout
 * and selects whichever is alive, saving it automatically into localStorage.
 */
export const autoDiscoverWorkingBackendUrl = async (): Promise<string> => {
  if (typeof window === 'undefined' || !isNativeAndroidApp()) {
    return '';
  }

  if (cachedWorkingBaseUrl) {
    return cachedWorkingBaseUrl;
  }

  if (discoveryPromise) {
    return discoveryPromise;
  }

  discoveryPromise = (async () => {
    // 1. Try currently saved or active candidate first
    const currentSaved = localStorage.getItem(BACKEND_URL_KEY);
    const urlsToTest = [
      currentSaved,
      ...CANDIDATE_BACKEND_URLS,
    ].filter(Boolean).map(u => u!.trim().replace(/\/+$/, ''));

    // Deduplicate
    const uniqueUrls = Array.from(new Set(urlsToTest));

    for (const url of uniqueUrls) {
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
    const fallback = CANDIDATE_BACKEND_URLS[0];
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

  if (!isNativeAndroidApp()) {
    return fetch(cleanPath, options);
  }

  // Mobile APK: try primary discovered base
  let baseUrl = await autoDiscoverWorkingBackendUrl();
  try {
    const res = await fetch(`${baseUrl}${cleanPath}`, options);
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
