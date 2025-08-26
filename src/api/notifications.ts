import { apiRequest } from './client';

export interface ApiNotification {
  id: string;
  createdAt: string;
  readAt?: string;
  type: string;
  linkTo?: string;
  payload?: Record<string, unknown>;
}

export async function listNotifications(limit: number, offset: number) {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  return apiRequest<ApiNotification[]>(`/notifications?${params.toString()}`);
}

export async function markNotificationRead(id: string) {
  return apiRequest<ApiNotification>(`/notifications/${id}/read`, { method: 'POST' });
}

export async function markAllNotificationsRead() {
  return apiRequest<unknown>(`/notifications/read-all`, { method: 'POST' });
}
