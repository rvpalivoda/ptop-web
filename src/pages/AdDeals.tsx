import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { useTranslation } from 'react-i18next';
import { getClientOrders, type OrderFull } from '@/api/orders';
import { OrderCard } from '@/components/OrderCard';

const AdDeals = () => {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<OrderFull[]>([]);

  const loadOrders = async () => {
    try {
      const data = await getClientOrders('author');
      const sorted = [...data].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      setOrders(sorted);
    } catch (err) {
      console.error('load client orders error:', err);
      setOrders([]);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white">
      <Header />
      <div className="container mx-auto px-4 pt-24 pb-8">
        <h1 className="text-2xl font-bold mb-4">{t('header.adDeals')}</h1>
        <ul className="space-y-4">
          {orders.map((order) => (
            <li key={order.id} data-testid="client-order">
              <OrderCard order={order} currentUserID={order.authorID} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default AdDeals;
