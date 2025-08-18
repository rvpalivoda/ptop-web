import { Header } from '@/components/Header';
import { useTranslation } from 'react-i18next';

const Orders = () => {
  const { t } = useTranslation();
  return (
      <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white">
      <Header />
      <div className="container mx-auto px-4 pt-24 pb-8">
        <h1 className="text-2xl font-bold mb-4">{t('header.orders')}</h1>
      </div>
    </div>
  );
};

export default Orders;
