import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getClientOrders, type OrderFull } from '@/api/orders';
import { OrderCard } from '@/components/OrderCard';
import { OrdersFilterPanel, type OrderFilters } from '@/components/OrdersFilterPanel';

type Mode = 'offerOwner' | 'author';

const Orders = () => {
  const { t } = useTranslation();
  const [mode, setMode] = useState<Mode>('offerOwner');
  const [orders, setOrders] = useState<OrderFull[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<OrderFilters>({ statuses: [] });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getClientOrders(mode)
      .then((data) => {
        if (cancelled) return;
        const sorted = [...data].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        setOrders(sorted);
      })
      .catch(() => !cancelled && setOrders([]))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [mode]);

  const title = useMemo(() => t('header.orders', 'Orders'), [t]);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (filters.statuses.length > 0 && !filters.statuses.includes(o.status)) return false;
      return true;
    });
  }, [orders, filters]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white" data-testid="orders-page">
      <div className="container mx-auto px-4 pt-24 pb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">{title}</h1>
          <div className="inline-flex rounded-2xl bg-white/5 p-1 ring-1 ring-white/10">
            <button
              type="button"
              onClick={() => setMode('offerOwner')}
              aria-pressed={mode === 'offerOwner'}
              className={[
                'rounded-2xl px-3 h-9 text-sm font-medium transition',
                mode === 'offerOwner' ? 'bg-white/15 text-white' : 'text-white/80 hover:bg-white/10',
              ].join(' ')}
            >
              {t('orderCard.fromMyAds', 'From my ads')}
            </button>
            <button
              type="button"
              onClick={() => setMode('author')}
              aria-pressed={mode === 'author'}
              className={[
                'rounded-2xl px-3 h-9 text-sm font-medium transition',
                mode === 'author' ? 'bg-white/15 text-white' : 'text-white/80 hover:bg-white/10',
              ].join(' ')}
            >
              {t('orderCard.iInitiated', 'I initiated')}
            </button>
          </div>
        </div>

        <OrdersFilterPanel filters={filters} onChange={setFilters} />

        {loading && (
          <div className="rounded-xl bg-white/5 ring-1 ring-white/10 p-4">{t('common.loading', 'Loading…')}</div>
        )}

        {!loading && (
          <ul className="space-y-4">
            {filtered.map((order) => (
              <li key={order.id} data-testid="client-order">
                <OrderCard
                  order={order}
                  currentUserID={mode === 'offerOwner' ? order.offerOwnerID : order.authorID}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Orders;
