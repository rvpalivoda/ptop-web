import { useEffect } from 'react';
import type { Offer } from '@/api/offers';

export interface OfferEvent {
  type: string;
  offer: Offer;
}

export function useOffersWS(
  token: string | undefined,
  onEvent: (event: OfferEvent) => void,
) {
  useEffect(() => {
    if (!token) return;

    const base = (import.meta.env.VITE_API_BASE_URL ?? '/api/v1')
      .replace(/^http/, 'ws')
      .replace(/\/$/, '');

    const ws = new WebSocket(`${base}/ws/offers?token=${token}`);
    ws.onmessage = (evt) => {
      const event: OfferEvent = JSON.parse(evt.data);
      onEvent(event);
    };
    return () => ws.close();
  }, [token, onEvent]);
}
