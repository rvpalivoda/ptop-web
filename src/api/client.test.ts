import { describe, it, expect, vi } from 'vitest';

vi.mock('./auth', () => ({
  refresh: vi.fn(),
}));
vi.mock('@/storage/token', () => ({
  loadTokens: vi.fn(),
  saveTokens: vi.fn(),
  clearTokens: vi.fn(),
}));
vi.mock('@/storage/user', () => ({
  clearUserInfo: vi.fn(),
}));

import { apiRequest } from './client';
import { refresh } from './auth';
import { loadTokens } from '@/storage/token';

describe('apiRequest', () => {
  it('не редиректит при 401 без токена', async () => {
    (loadTokens as unknown as ReturnType<typeof vi.fn>).mockReturnValue(null);
    vi.spyOn(global, 'fetch').mockResolvedValue(new Response(null, { status: 401 }));
    await expect(apiRequest('/offers')).rejects.toThrow('Unauthorized');
    expect(refresh).not.toHaveBeenCalled();
  });
});
