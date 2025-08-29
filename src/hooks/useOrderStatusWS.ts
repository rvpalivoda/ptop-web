import { useEffect } from 'react';
import type { OrderFull } from '@/api/orders';

type OrderStatusEvent = {
  type?: string; // ожидаем "order.status_changed"
  order?: OrderFull;
  [k: string]: unknown;
};

export function useOrderStatusWS(
  orderId: string | undefined,
  token: string | undefined,
  onUpdate: (order: OrderFull) => void,
  opts: {
    onConnected?: () => void;
    onDisconnected?: () => void;
    onError?: (e: Event) => void;
  } = {}
) {
  useEffect(() => {
    if (!orderId || !token) return;

    const base = (import.meta.env.VITE_API_BASE_URL ?? '/api/v1')
      .replace(/^http/, 'ws')
      .replace(/\/$/, '');
    const url = `${base}/ws/orders/${orderId}/status?token=${encodeURIComponent(token)}`;

    const ws = new WebSocket(url);

    ws.onopen = () => opts.onConnected?.();
    ws.onclose = () => opts.onDisconnected?.();
    ws.onerror = (e) => opts.onError?.(e);
    ws.onmessage = (evt) => {
      try {
        const data: OrderStatusEvent = JSON.parse(evt.data);
        if (data && typeof data === 'object' && data.order) {
          onUpdate(data.order);
        }
      } catch {
        // ignore parse errors
      }
    };

    return () => ws.close();
  }, [orderId, token]);
}

