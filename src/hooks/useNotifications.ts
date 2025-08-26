import { useAuth } from '@/context';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ApiNotification,
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '@/api/notifications';

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  isRead: boolean;
  linkTo?: string;
}

function mapNotification(n: ApiNotification): NotificationItem {
  const payload = (n.payload ?? {}) as Record<string, unknown>;
  return {
    id: n.id,
    title: String(payload.title ?? n.type),
    body: String(payload.body ?? ''),
    createdAt: n.createdAt,
    isRead: !!n.readAt,
    linkTo: (payload.linkTo as string | undefined) ?? n.linkTo,
  };
}

const PAGE_SIZE = 20;

let ws: WebSocket | null = null;
let wsToken: string | null = null;
const listeners = new Set<(n: ApiNotification) => void>();

function connect(token: string) {
  if (ws && wsToken === token) return;
  if (ws) ws.close();
  wsToken = token;
  const base = (import.meta.env.VITE_API_BASE_URL ?? '/api/v1')
    .replace(/^http/, 'ws')
    .replace(/\/$/, '');
  ws = new WebSocket(`${base}/ws/notifications?token=${token}`);
  ws.onmessage = (evt) => {
    try {
      const data: ApiNotification = JSON.parse(evt.data);
      listeners.forEach((fn) => fn(data));
    } catch {
      // ignore
    }
  };
}

function closeWs() {
  if (ws) {
    ws.close();
    ws = null;
    wsToken = null;
  }
  listeners.clear();
}

function subscribe(token: string, fn: (n: ApiNotification) => void) {
  connect(token);
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function useNotifications() {
  const { tokens } = useAuth();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const res = await listNotifications(PAGE_SIZE, offset);
      const mapped = res.map(mapNotification);
      setItems((prev) => [...prev, ...mapped]);
      setOffset((prev) => prev + mapped.length);
      if (res.length < PAGE_SIZE) {
        setHasMore(false);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, offset]);

  useEffect(() => {
    loadMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const token = tokens?.access;
    if (!token) {
      closeWs();
      return;
    }
    const unsubscribe = subscribe(token, (data) => {
      setItems((prev) => [mapNotification(data), ...prev]);
    });
    return unsubscribe;
  }, [tokens?.access]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await markNotificationRead(id);
    } catch {
      // ignore
    }
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await markAllNotificationsRead();
    } catch {
      // ignore
    }
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }, []);

  const unreadCount = useMemo(
    () => items.reduce((acc, n) => acc + (n.isRead ? 0 : 1), 0),
    [items],
  );

  return {
    items,
    unreadCount,
    markAsRead,
    markAllAsRead,
    loadMore,
    hasMore,
    loading,
  };
}
