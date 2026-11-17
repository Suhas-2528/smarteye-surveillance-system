/**
 * SmartEye Central API Configuration & Network Layer
 * Supports Web, Mobile Browsers, and Android Capacitor Native App
 */

export const KNOWN_SERVER_HOSTS = [
  'http://192.168.1.6:3001',
  'http://localhost:3001'
];

export const DEFAULT_SERVER_URL = (import.meta as any).env?.VITE_API_URL || 'http://192.168.1.6:3001';

// Check if running inside Capacitor native Android/iOS app container
export const isNativeApp = (): boolean => {
  if (typeof window === 'undefined') return false;
  const win = window as any;
  if (win.Capacitor?.isNativePlatform?.()) return true;
  if (win.Capacitor?.getPlatform?.() === 'android' || win.Capacitor?.getPlatform?.() === 'ios') return true;
  if (window.location.protocol === 'capacitor:' || window.location.protocol === 'file:') return true;
  // Android WebView inside Capacitor serves from localhost:
  if (
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') &&
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
  ) {
    return true;
  }
  return false;
};

// Retrieve or dynamically determine the backend API base URL
export const getApiBaseUrl = (): string => {
  // 1. Check user-configured custom server IP in localStorage
  if (typeof window !== 'undefined' && window.localStorage) {
    const savedUrl = localStorage.getItem('smarteye_api_url');
    if (savedUrl && savedUrl.trim()) {
      return savedUrl.trim().replace(/\/+$/, '');
    }
  }

  // 2. Check environment variable VITE_API_URL if configured during build
  const envUrl = (import.meta as any).env?.VITE_API_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, '');
  }

  // 3. In browser/mobile browser, if accessing via IP (e.g. 10.240.190.226:3000), use that host
  if (typeof window !== 'undefined' && window.location) {
    const { hostname, protocol, port } = window.location;
    if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1' && protocol.startsWith('http')) {
      return `${protocol}//${hostname}${port ? `:${port}` : ''}`;
    }
  }

  // 4. In native Capacitor Android/iOS app container, localhost refers to device itself
  if (isNativeApp()) {
    return DEFAULT_SERVER_URL;
  }

  // 5. Fallback default for desktop local dev browser (empty string = relative URL)
  return '';
};

// Set a custom backend API URL (e.g., "http://10.240.190.226:3000")
export const setApiBaseUrl = (url: string): void => {
  if (typeof window !== 'undefined' && window.localStorage) {
    if (url && url.trim()) {
      localStorage.setItem('smarteye_api_url', url.trim().replace(/\/+$/, ''));
    } else {
      localStorage.removeItem('smarteye_api_url');
    }
  }
};

// Auto-discover which known backend server is reachable
export const autoDiscoverActiveServer = async (): Promise<string> => {
  if (typeof window === 'undefined') return DEFAULT_SERVER_URL;
  
  const saved = localStorage.getItem('smarteye_api_url');
  if (saved && saved.trim()) {
    const check = await checkServerConnection(saved.trim());
    if (check.ok) return saved.trim();
  }

  for (const host of KNOWN_SERVER_HOSTS) {
    try {
      const check = await checkServerConnection(host);
      if (check.ok) {
        setApiBaseUrl(host);
        return host;
      }
    } catch {}
  }
  return DEFAULT_SERVER_URL;
};

// Auto-probe on initial script execution on mobile
if (typeof window !== 'undefined' && isNativeApp()) {
  setTimeout(() => {
    autoDiscoverActiveServer();
  }, 300);
}

// Format an API endpoint path
export const apiUrl = (endpoint: string): string => {
  const base = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return base ? `${base}${cleanEndpoint}` : cleanEndpoint;
};

// Format image URL so static uploads and relative paths load properly on Android & Web
export const getImageUrl = (url?: string, tryAlternate = false): string => {
  if (!url) return '';
  if (url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }

  const base = getApiBaseUrl();
  const activeBase = tryAlternate
    ? (KNOWN_SERVER_HOSTS.find(h => h !== base) || DEFAULT_SERVER_URL)
    : (base || DEFAULT_SERVER_URL);

  // If already absolute URL:
  if (url.startsWith('http://') || url.startsWith('https://')) {
    // If it points to localhost, 127.0.0.1, or an outdated LAN IP on mobile native app:
    if (isNativeApp() || base) {
      if (
        url.includes('://localhost') ||
        url.includes('://127.0.0.1') ||
        url.includes('://192.168.1.6:3001') ||
        url.includes('://192.168.1.6:3000') ||
        url.includes('://10.240.190.226')
      ) {
        return url.replace(/https?:\/\/[^/]+/, activeBase);
      }
    }
    return url;
  }

  // Relative path (like /uploads/alert-123.jpg)
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  if (isNativeApp() || base) {
    return `${activeBase}${cleanPath}`;
  }
  return cleanPath;
};

// Central fetch wrapper that prefixes API base URL and handles auto-reconnect fallback
export const apiFetch = async (endpoint: string, options?: RequestInit): Promise<Response> => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const base = getApiBaseUrl();
  const primaryUrl = base ? `${base}${cleanEndpoint}` : cleanEndpoint;

  try {
    const res = await fetch(primaryUrl, options);
    return res;
  } catch (err) {
    // If connection failed, try known candidate hosts
    for (const altHost of KNOWN_SERVER_HOSTS) {
      if (altHost !== base) {
        try {
          const fallbackUrl = `${altHost}${cleanEndpoint}`;
          const fallbackRes = await fetch(fallbackUrl, options);
          if (fallbackRes.ok) {
            setApiBaseUrl(altHost);
            return fallbackRes;
          }
        } catch {}
      }
    }
    throw err;
  }
};

// Quick health check to test backend connection
export const checkServerConnection = async (testUrl?: string): Promise<{ ok: boolean; message: string; host: string }> => {
  const targetBase = testUrl ? testUrl.trim().replace(/\/+$/, '') : getApiBaseUrl();
  const targetUrl = targetBase ? `${targetBase}/api/db-status` : '/api/db-status';
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(targetUrl, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (res.ok) {
      const data = await res.json();
      return { 
        ok: true, 
        message: data.mode || 'Connected to backend',
        host: targetBase || 'Local Server'
      };
    }
    return { ok: false, message: `Server returned HTTP ${res.status}`, host: targetBase || 'Local Server' };
  } catch (err: any) {
    return { 
      ok: false, 
      message: err.name === 'AbortError' ? 'Connection timed out' : 'Could not reach server',
      host: targetBase || 'Local Server'
    };
  }
};
