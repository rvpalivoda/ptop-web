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
  // если отправляем FormData, пусть браузер сам поставит заголовок
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

  if (
    response.status === 401 &&
    !isRetry &&
    endpoint !== '/auth/refresh' &&
    endpoint !== '/auth/login'
  ) {
    try {
      if (tokens?.refresh) {
        const newTokens = await refreshTokens();
        saveTokens(newTokens);
        return apiRequest<T>(endpoint, options, true);
      }
    } catch {
      // ignore refresh errors
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
