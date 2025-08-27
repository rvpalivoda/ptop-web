import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';

vi.mock('@/context', () => ({ useAuth: () => ({ tokens: null }) }));
vi.mock('@/api/notifications', () => ({
  listNotifications: vi.fn().mockResolvedValue([]),
  markNotificationRead: vi.fn(),
  markAllNotificationsRead: vi.fn(),
}));

import { listNotifications } from '@/api/notifications';
import { useNotifications } from './useNotifications';

afterEach(() => {
  vi.clearAllMocks();
});

describe('useNotifications', () => {
  it('не запрашивает уведомления без токена', () => {
    renderHook(() => useNotifications());
    expect(listNotifications).not.toHaveBeenCalled();
  });
});
