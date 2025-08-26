
import { useEffect, useState, useCallback } from 'react';
import { getOffers, type Offer } from '@/api/offers';
import type { ClientPaymentMethod } from '@/api/clientPaymentMethods';
import { OfferCard } from './OfferCard';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { useOffersWS, type OfferEvent } from '@/hooks/use-offers-ws';

interface OfferListProps {
  type: 'buy' | 'sell';
  filters: {
    fromAsset: string;
    toAsset: string;
    minAmount: string;
    maxAmount: string;
    paymentMethod: string;
  };
}

interface OfferItem {
  id: string;
  trader: {
    name: string;
    rating: number;
    completedTrades: number;
    online: boolean;
  };
  fromAsset: { name: string };
  toAsset: { name: string };
  amount: string;
  price: string;
  paymentMethods: ClientPaymentMethod[];
  limits: { min: string; max: string };
  type: 'buy' | 'sell';
  isEnabled?: boolean;
  conditions?: string;
  orderExpirationTimeout?: number;
  TTL?: string;
}

function mapOffer(o: Offer): OfferItem {
  return {
    id: o.id,
    trader: {
      name: o.client?.username ?? 'Трейдер',
      rating: o.client?.rating ?? 0,
      completedTrades: o.client?.ordersCount ?? 0,
      online: true,
    },
    fromAsset: o.fromAsset ?? { name: o.fromAssetID },
    toAsset: o.toAsset ?? { name: o.toAssetID },
    amount: String(o.amount),
    price: String(o.price),
    paymentMethods: o.clientPaymentMethods ?? [],
    limits: { min: String(o.minAmount), max: String(o.maxAmount) },
    type: o.type as 'buy' | 'sell',
    isEnabled: o.isEnabled,
    conditions: o.conditions,
    offerExpirationTimeout: o.orderExpirationTimeout,
    TTL: o.TTL,
  };
}

export const OfferList = ({ type, filters }: OfferListProps) => {
  const [offers, setOffers] = useState<OfferItem[]>([]);
  const { tokens } = useAuth();

  const queryType = type === 'buy' ? 'sell' : 'buy';

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const offers = await getOffers({
          from_asset: filters.fromAsset,
          to_asset: filters.toAsset,
          min_amount: filters.minAmount,
          max_amount: filters.maxAmount,
          payment_method: filters.paymentMethod,
          type: queryType,
        });
        if (cancelled) return;
        const mapped = offers.map(mapOffer);
        setOffers(mapped);
      } catch (err) {
        console.error('load offers error:', err);
        if (!cancelled) setOffers([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [queryType, filters]);

  const handleWsEvent = useCallback(
    ({ type: eventType, offer }: OfferEvent) => {
      const mapped = mapOffer(offer);
      if (mapped.type !== queryType) return;

      if (
        (filters.fromAsset && filters.fromAsset !== 'all' &&
          mapped.fromAsset.name !== filters.fromAsset) ||
        (filters.toAsset && filters.toAsset !== 'all' &&
          mapped.toAsset.name !== filters.toAsset) ||
        (filters.paymentMethod && filters.paymentMethod !== 'all' &&
          !mapped.paymentMethods.some((pm) => pm.id === filters.paymentMethod)) ||
        (filters.minAmount && Number(mapped.amount) < Number(filters.minAmount)) ||
        (filters.maxAmount && Number(mapped.amount) > Number(filters.maxAmount))
      ) {
        return;
      }

      setOffers((prev) => {
        const idx = prev.findIndex((o) => o.id === mapped.id);
        if (eventType === 'deleted') {
          if (idx === -1) return prev;
          const next = [...prev];
          next.splice(idx, 1);
          return next;
        }
        if (idx === -1) {
          return [...prev, mapped];
        }
        const next = [...prev];
        next[idx] = mapped;
        return next;
      });
    },
    [filters, queryType],
  );

  useOffersWS(tokens?.access, handleWsEvent);

  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">
          {queryType === "buy" ? t("offers.buy") : t("offers.sell")}
        </h3>
        <span className="text-sm text-gray-400">
          {offers.length} {t('offers.found')}
        </span>
      </div>

      {offers.map((offer) => (
        <OfferCard key={offer.id} offer={offer} />
      ))}
    </div>
  );
};
