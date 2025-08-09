
import { useEffect, useState } from 'react';
import { getOffers } from '@/api/offers';
import { OfferCard } from './OfferCard';

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

interface OrderItem {
  id: string;
  trader: {
    name: string;
    rating: number;
    completedTrades: number;
    online: boolean;
  };
  currency: string;
  amount: string;
  price: string;
  paymentMethods: string[];
  limits: { min: string; max: string };
  type: 'buy' | 'sell';
}

export const OfferList = ({ type, filters }: OfferListProps) => {
  const [orders, setOrders] = useState<OrderItem[]>([]);

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
          type,
        });
        if (cancelled) return;
        const mapped = offers.map((o) => ({
          id: o.id,
          trader: {
            name: o.clientID ?? 'Трейдер',
            rating: 0,
            completedTrades: 0,
            online: true,
          },
          currency: o.fromAssetID,
          amount: String(o.amount),
          price: String(o.price),
          paymentMethods: [] as string[],
          limits: { min: String(o.minAmount), max: String(o.maxAmount) },
          type,
        }));
        setOrders(mapped);
      } catch (err) {
        console.error('load offers error:', err);
        if (!cancelled) setOrders([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [type, filters]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">
          {type === 'buy' ? 'Объявления о покупке' : 'Объявления о продаже'}
        </h3>
        <span className="text-sm text-gray-400">
          Найдено: {orders.length} объявлений
        </span>
      </div>

      {orders.map((order) => (
        <OfferCard key={order.id} order={order} />
      ))}
    </div>
  );
};
