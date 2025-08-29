
import { useEffect, useState, useCallback, useRef } from 'react';
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
      name: o.client?.username ?? '',
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
    orderExpirationTimeout: o.orderExpirationTimeout,
    TTL: o.TTL,
  };
}

export const OfferList = ({ type, filters }: OfferListProps) => {
  const [offers, setOffers] = useState<OfferItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const LIMIT = 20;
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  // refs for stable IO behavior and preventing multiple calls
  const inFlightRef = useRef(false);
  const hasMoreRef = useRef(true);
  const offsetRef = useRef(0);
  const { tokens } = useAuth();

  const queryType = type === 'buy' ? 'sell' : 'buy';

  // Load next page of data
  const { t } = useTranslation();

  const localizeOffer = useCallback((o: Offer): OfferItem => {
    const base = mapOffer(o);
    if (!base.trader.name) base.trader.name = t('offers.traderDefault');
    return base;
  }, [t]);

  const loadNext = useCallback(async () => {
    if (inFlightRef.current || !hasMoreRef.current) return;
    inFlightRef.current = true;
    setLoading(true);
    const nextOffset = offsetRef.current;
    try {
      const result = await getOffers({
        from_asset: filters.fromAsset,
        to_asset: filters.toAsset,
        min_amount: filters.minAmount,
        max_amount: filters.maxAmount,
        payment_method: filters.paymentMethod,
        type: queryType,
        limit: LIMIT,
        offset: nextOffset,
      });
      const mapped = result.map(localizeOffer);
      setOffers((prev) => (nextOffset === 0 ? mapped : [...prev, ...mapped]));
      const newOffset = nextOffset + mapped.length;
      offsetRef.current = newOffset;
      setOffset(newOffset);
      const more = mapped.length === LIMIT;
      hasMoreRef.current = more;
      setHasMore(more);
    } catch (err) {
      console.error('load offers error:', err);
      if (nextOffset === 0) setOffers([]);
      hasMoreRef.current = false;
      setHasMore(false);
    } finally {
      inFlightRef.current = false;
      setLoading(false);
    }
  }, [filters.fromAsset, filters.toAsset, filters.minAmount, filters.maxAmount, filters.paymentMethod, queryType, localizeOffer]);

  // Reset pagination on type/filters change
  useEffect(() => {
    setOffers([]);
    setHasMore(true);
    hasMoreRef.current = true;
    setOffset(0);
    offsetRef.current = 0;
    inFlightRef.current = false;
    // начальная загрузка
    loadNext();
  }, [queryType, filters, loadNext]);

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      const [entry] = entries;
      if (entry.isIntersecting) {
        loadNext();
      }
    }, { rootMargin: '400px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [loadNext]);

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

  

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">
          {queryType === "sell" ? t("offers.buy") : t("offers.sell")}
        </h3>
        <span className="text-sm text-gray-400">
          {offers.length} {t('offers.found')}
        </span>
      </div>

      {offers.map((offer) => (
        <OfferCard key={offer.id} offer={offer} />
      ))}

      {/* sentinel for infinite scroll */}
      <div ref={sentinelRef} />

      {/* loading indicator / end of list */}
      <div className="py-3 text-center text-sm text-gray-400">
        {loading ? t('offers.loading') : hasMore ? '' : t('offers.noMore')}
      </div>
    </div>
  );
};
