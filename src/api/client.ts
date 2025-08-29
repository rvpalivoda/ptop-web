import { loadTokens, saveTokens, clearTokens } from '@/storage/token';
import { clearUserInfo } from '@/storage/user';
import { refresh as refreshTokens } from './auth';

const BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ?? '/api/v1'
).replace(/\/$/, '');

function clearAuth() {
  clearTokens();
  clearUserInfo();
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  isRetry = false,
): Promise<T> {
  const tokens = loadTokens();
  const headers = new Headers(options.headers);
  // When sending FormData, let the browser set the header
  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (tokens?.access) {
    headers.set('Authorization', `Bearer ${tokens.access}`);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Handle 401: try to refresh access by refresh token and retry request
  if (response.status === 401) {
    // If this is a retry after refresh — sign out
    if (isRetry || endpoint === '/auth/refresh') {
      clearAuth();
      throw new Error('Unauthorized');
    }
    // Do not try to refresh for login/refresh routes
    if (endpoint === '/auth/login') {
      clearAuth();
      throw new Error('Unauthorized');
    }
    try {
      if (tokens?.refresh) {
        const newTokens = await refreshTokens();
        saveTokens(newTokens);
        return apiRequest<T>(endpoint, options, true);
      }
    } catch {
      // refresh failed — clear session
    }
    clearAuth();
    throw new Error('Unauthorized');
  }

  if (endpoint === '/auth/refresh' && !response.ok) {
    clearAuth();
  }

  if (!response.ok) {
    let message = `API error: ${response.status}`;
    try {
      const data = await response.json();
      if (data && typeof (data as any).detail === 'string') {
        message = (data as any).detail;
      }
    } catch {
      // ignore json parse errors and use default message
    }
    throw new Error(message);
  }
  return (await response.json()) as T;
}
