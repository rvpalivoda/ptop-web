import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getClientOrders, type OrderFull } from '@/api/orders';
import { OrderCard } from '@/components/OrderCard';

const MyDeals = () => {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<OrderFull[]>([]);

  const loadOrders = async () => {
    try {
      const data = await getClientOrders('offerOwner');
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
      <div className="container mx-auto px-4 pt-24 pb-8">
        <h1 className="text-2xl font-bold mb-4">{t('header.myDeals')}</h1>
        <ul className="space-y-4">
          {orders.map((order) => (
            <li key={order.id} data-testid="client-order">
              <OrderCard order={order} currentUserID={order.offerOwnerID} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default MyDeals;
