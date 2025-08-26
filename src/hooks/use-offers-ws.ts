import { useEffect } from 'react';
import type { Offer } from '@/api/offers';

export interface OfferEvent {
  type: string;
  offer: Offer;
}

let ws: WebSocket | null = null;
let wsToken: string | null = null;
const listeners = new Set<(event: OfferEvent) => void>();

function connect(token: string) {
  if (ws && wsToken === token) return;
  if (ws) ws.close();
  wsToken = token;
  const base = (import.meta.env.VITE_API_BASE_URL ?? '/api/v1')
    .replace(/^http/, 'ws')
    .replace(/\/$/, '');
  ws = new WebSocket(`${base}/ws/offers?token=${token}`);
  ws.onmessage = (evt) => {
    const event: OfferEvent = JSON.parse(evt.data);
    listeners.forEach((fn) => fn(event));
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

function subscribe(token: string, fn: (event: OfferEvent) => void) {
  connect(token);
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function useOffersWS(
  token: string | undefined,
  onEvent: (event: OfferEvent) => void,
) {
  useEffect(() => {
    if (!token) {
      closeWs();
      return;
    }
    const unsubscribe = subscribe(token, onEvent);
    return unsubscribe;
  }, [token, onEvent]);
}
